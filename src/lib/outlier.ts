// Outlier scoring. The Data API only gives point-in-time numbers,
// so the signal is a ratio: how far a video's views exceed what the
// channel's size would predict. multiplier = views / subscribers.
//
// multiplier ≈ 1   → did about as well as the channel's reach
// multiplier 3–10  → real outlier, the idea travelled
// multiplier 10+   → broke out well beyond the audience

import { VideoStat, ChannelStat } from "./youtube";

export interface Outlier extends VideoStat {
  subs: number;
  multiplier: number;
  scorable: boolean; // false when subs are hidden / zero
}

export function scoreOutliers(
  videos: VideoStat[],
  channels: Map<string, ChannelStat>
): Outlier[] {
  return videos
    .map((v) => {
      const ch = channels.get(v.channelId);
      const subs = ch?.subs ?? 0;
      const scorable = !!ch && !ch.hidden && subs > 0;
      const multiplier = scorable ? +(v.views / subs).toFixed(2) : 0;
      return { ...v, subs, multiplier, scorable };
    })
    .sort((a, b) => b.multiplier - a.multiplier);
}
