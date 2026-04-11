// Distribution registry — stub for v1
// Future: TikTok, Instagram Reels, YouTube Shorts, Twitter/X

export interface Distributor {
  post(outputUrl: string, content: Record<string, unknown>): Promise<{ postUrl: string }>;
}

export const distributors: Record<string, Distributor> = {
  // tiktok: tiktokDistributor,
  // instagram: instagramDistributor,
};

export function getDistributor(name: string): Distributor {
  const distributor = distributors[name];
  if (!distributor) throw new Error(`Distributor not yet implemented: ${name}`);
  return distributor;
}
