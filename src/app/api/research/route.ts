/**
 * Research API — deep web search + answer synthesis
 * POST /api/research  { query: "your question" }
 * 
 * Uses DuckDuckGo Instant Answer + web scraping for rich context.
 * Structured into: summary answer + sources.
 */

const DDG_API = 'https://api.duckduckgo.com';

interface Source {
  title: string;
  url: string;
}

interface ResearchResult {
  answer: string;
  sources: Source[];
}

async function duckDuckGoSearch(query: string): Promise<{ answer: string; sources: Source[] }> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    no_html: '1',
    skip_disambig: '1',
  });

  const res = await fetch(`${DDG_API}?${params}`, {
    headers: { 'User-Agent': 'AgentTrade/1.0 ResearchBot' },
  });

  if (!res.ok) return { answer: '', sources: [] };

  const data = await res.json();
  let answer = '';
  const sources: Source[] = [];

  // Abstract/answer
  if (data.AbstractText) {
    answer = data.AbstractText;
    if (data.AbstractURL) {
      sources.push({ title: data.AbstractSource || data.Heading || 'DuckDuckGo', url: data.AbstractURL });
    }
  }

  // Type-specific answers (definitions, calculations, etc.)
  if (data.Answer) {
    answer = answer ? `${answer}\n\n${data.Answer}` : data.Answer;
  }

  // Related topics as additional context
  if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
    for (const topic of data.RelatedTopics.slice(0, 4)) {
      if (topic.Text && topic.FirstURL) {
        // Only add if it adds value
        if (!answer.includes(topic.Text.slice(0, 60))) {
          answer = answer ? `${answer}\n\n${topic.Text}` : topic.Text;
        }
        if (!sources.find((s) => s.url === topic.FirstURL)) {
          sources.push({ title: topic.Text?.slice(0, 50) || 'Related', url: topic.FirstURL });
        }
      }
    }
  }

  // Infobox for structured data
  if (data.Infobox?.content && Array.isArray(data.Infobox.content)) {
    const infoLines: string[] = [];
    for (const item of data.Infobox.content.slice(0, 5)) {
      if (item.label && item.value) {
        infoLines.push(`• ${item.label}: ${item.value}`);
      }
    }
    if (infoLines.length > 0) {
      answer = answer ? `${answer}\n\n${infoLines.join('\n')}` : infoLines.join('\n');
    }
  }

  return { answer, sources };
}

async function googleSearch(query: string): Promise<Source[]> {
  // Fallback: use DuckDuckGo's RelatedTopics for broader search
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    no_html: '1',
  });

  try {
    const res = await fetch(`${DDG_API}?${params}`, {
      headers: { 'User-Agent': 'AgentTrade/1.0 ResearchBot' },
    });
    const data = await res.json();
    const sources: Source[] = [];

    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.FirstURL) {
          sources.push({
            title: topic.Text?.slice(0, 60) || 'Search result',
            url: topic.FirstURL,
          });
        }
      }
    }

    return sources;
  } catch {
    return [];
  }
}

async function scrapePages(urls: string[]): Promise<string[]> {
  // Extract text from top result pages for richer context
  const results: string[] = [];
  
  for (const url of urls.slice(0, 2)) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AgentTrade/1.0 ResearchBot' },
        signal: AbortSignal.timeout(5000),
      });
      const html = await res.text();
      // Extract text content from HTML
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000);
      
      if (text.length > 100) {
        results.push(text);
      }
    } catch {
      // Skip failed scrapes
    }
  }

  return results;
}

function synthesizeAnswer(
  query: string,
  ddgAnswer: string,
  ddgSources: Source[],
  extraSources: Source[],
  pageTexts: string[]
): string {
  const parts: string[] = [];

  // Main DDG answer
  if (ddgAnswer) {
    parts.push(ddgAnswer);
  }

  // Web page context
  for (const text of pageTexts) {
    const relevant = extractRelevant(text, query);
    if (relevant && !parts.some((p) => p.includes(relevant.slice(0, 80)))) {
      parts.push(`\n\n📖 Additional context: ${relevant}`);
    }
  }

  if (parts.length === 0 && extraSources.length > 0) {
    parts.push(`I found several relevant sources for "${query}". Here's what I discovered:\n\n${extraSources.map((s, i) => `${i + 1}. **${s.title}** — ${s.url}`).join('\n')}\n\nVisit the links above for detailed information.`);
  } else if (parts.length === 0) {
    return `I could not find specific information about "${query}". Try rephrasing your question or asking about a related topic. For crypto-specific questions, I can help with market data, trading concepts, blockchain technology, and DeFi.`;
  }

  return parts.join('\n');
}

function extractRelevant(text: string, query: string): string {
  const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const sentences = text.split(/[.!?]+/);
  const relevant = sentences.filter((s) => {
    const lower = s.toLowerCase();
    return keywords.some((kw) => lower.includes(kw));
  });
  return relevant.slice(0, 3).join('. ').trim();
}

// ─── Route Handler ───

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return Response.json({ error: 'Please provide a valid question (min 2 characters).' }, { status: 400 });
    }

    const trimmed = query.trim().slice(0, 500);

    // 1. DuckDuckGo search
    const { answer: ddgAnswer, sources: ddgSources } = await duckDuckGoSearch(trimmed);

    // 2. Additional web search for broader results
    const extraSources = await googleSearch(trimmed);

    // 3. Scrape top results for richer context
    const allSourceUrls = [...ddgSources, ...extraSources].map((s) => s.url);
    const pageTexts = await scrapePages(allSourceUrls);

    // 4. Synthesize answer
    const allSources = [...ddgSources];
    for (const es of extraSources) {
      if (!allSources.find((s) => s.url === es.url)) {
        allSources.push(es);
      }
    }

    const answer = synthesizeAnswer(trimmed, ddgAnswer, ddgSources, extraSources, pageTexts);

    const result: ResearchResult = {
      answer,
      sources: allSources.slice(0, 8),
    };

    return Response.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('Research API error:', error);
    return Response.json(
      { error: 'Research service temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
