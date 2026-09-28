// A fake YouTube Data API v3 for tests: answers by endpoint from an in-memory world,
// counts requests, and never needs a key or the network.

const DAY = 86_400_000;

export function iso(now, daysAgo) {
  return new Date(now.getTime() - daysAgo * DAY).toISOString();
}

/** One channel with `count` long-form uploads at `views` each, newest first, plus optional extras. */
export function channel(id, { subscribers = 10_000, customUrl, views = 1_000, count = 30, now, country, extra = [] } = {}) {
  const uploads = Array.from({ length: count }, (_, i) => ({
    id: `${id.slice(2, 8)}v${String(i).padStart(4, "0")}`,
    channelId: id,
    publishedAt: iso(now, 5 + i * 3),
    duration: "PT12M",
    views,
  }));
  return { id, subscribers, customUrl, country, uploads: [...extra, ...uploads] };
}

export function fakeYoutube(world, options = {}) {
  const requests = [];
  const videos = new Map(world.channels.flatMap((c) => c.uploads.map((v) => [v.id, { ...v, channelTitle: c.customUrl ?? c.id }])));
  const fetch = async (url) => {
    const parsed = new URL(url);
    const endpoint = parsed.pathname.split("/").pop();
    const params = Object.fromEntries(parsed.searchParams);
    requests.push({ endpoint, params });
    if (options.fail?.[endpoint]) return { ok: false, status: options.fail[endpoint].status, json: async () => options.fail[endpoint].body };
    const failure = options.failWhen?.(endpoint, params, requests.filter((r) => r.endpoint === endpoint).length);
    if (failure) return { ok: false, status: failure.status, json: async () => failure.body };
    if (endpoint === "search") {
      const ids = world.search?.[params.q] ?? [];
      return { ok: true, status: 200, json: async () => ({ items: ids.map((videoId) => ({ id: { kind: "youtube#video", videoId } })) }) };
    }
    if (endpoint === "channels") {
      const wanted = params.id ? params.id.split(",") : world.channels.filter((c) => `@${c.customUrl}` === params.forHandle).map((c) => c.id);
      const items = world.channels.filter((c) => wanted.includes(c.id)).map((c) => ({
        id: c.id,
        snippet: { title: `Channel ${c.id.slice(2, 6)}`, customUrl: c.customUrl ? `@${c.customUrl}` : undefined, country: c.country, thumbnails: { high: { url: `https://yt3.example/${c.id}.jpg` } } },
        statistics: { subscriberCount: String(c.subscribers), hiddenSubscriberCount: false },
        contentDetails: { relatedPlaylists: { uploads: `UU${c.id.slice(2)}` } },
      }));
      return { ok: true, status: 200, json: async () => ({ items }) };
    }
    if (endpoint === "playlistItems") {
      const longOnly = params.playlistId.startsWith("UULF");
      if (longOnly && world.noUulf) return { ok: false, status: 404, json: async () => ({ error: { code: 404, message: "playlist not found", errors: [{ reason: "playlistNotFound" }] } }) };
      const channelId = `UC${params.playlistId.slice(longOnly ? 4 : 2)}`;
      const own = world.channels.find((c) => c.id === channelId)?.uploads ?? [];
      const listed = own
        .filter((v) => !longOnly || !v.short)
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .slice(0, Number(params.maxResults));
      return { ok: true, status: 200, json: async () => ({ items: listed.map((v) => ({ contentDetails: { videoId: v.id, videoPublishedAt: v.publishedAt } })) }) };
    }
    if (endpoint === "videos") {
      const items = params.id.split(",").map((id) => videos.get(id)).filter(Boolean).map((v) => ({
        id: v.id,
        snippet: {
          publishedAt: v.publishedAt,
          channelId: v.channelId,
          channelTitle: v.channelTitle,
          title: v.title ?? `Video ${v.id}`,
          description: v.description,
          thumbnails: { high: { url: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` } },
          liveBroadcastContent: v.live ? "live" : "none",
          defaultAudioLanguage: v.language,
        },
        contentDetails: { duration: v.duration },
        ...(v.noStats ? {} : { statistics: { viewCount: String(v.views), likeCount: "10", commentCount: "2" } }),
      }));
      return { ok: true, status: 200, json: async () => ({ items }) };
    }
    return { ok: false, status: 400, json: async () => ({ error: { message: `unknown endpoint ${endpoint}` } }) };
  };
  return { fetch, requests };
}
