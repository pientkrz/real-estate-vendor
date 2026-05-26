import { describe, it, expect } from 'vitest';
import { getYouTubeEmbedUrl } from './videoUrl';

describe('getYouTubeEmbedUrl', () => {

  // ── happy paths ───────────────────────────────────────────────────────────

  it('converts a plain watch URL', () => {
    expect(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=TYdzamvH0uY'))
      .toBe('https://www.youtube.com/embed/TYdzamvH0uY');
  });

  it('ignores extra query params (e.g. &t=23s from XML &amp;)', () => {
    expect(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=TYdzamvH0uY&t=23s'))
      .toBe('https://www.youtube.com/embed/TYdzamvH0uY');
  });

  it('handles youtube.com without www', () => {
    expect(getYouTubeEmbedUrl('https://youtube.com/watch?v=udN17HbiXJU'))
      .toBe('https://www.youtube.com/embed/udN17HbiXJU');
  });

  it('handles youtu.be short URLs', () => {
    expect(getYouTubeEmbedUrl('https://youtu.be/D5g0Kd_oaFE'))
      .toBe('https://www.youtube.com/embed/D5g0Kd_oaFE');
  });

  it('uses the real video IDs that appear in properties_otodom.xml', () => {
    const realUrls = [
      ['https://www.youtube.com/watch?v=TYdzamvH0uY&t=23s', 'TYdzamvH0uY'],
      ['https://www.youtube.com/watch?v=udN17HbiXJU',        'udN17HbiXJU'],
      ['https://www.youtube.com/watch?v=VA90uQnE25Q',        'VA90uQnE25Q'],
      ['https://www.youtube.com/watch?v=c2fx4NNgIN0',        'c2fx4NNgIN0'],
      ['https://www.youtube.com/watch?v=D5g0Kd_oaFE',        'D5g0Kd_oaFE'],
      ['https://www.youtube.com/watch?v=SY0XU2PWd4k',        'SY0XU2PWd4k'],
      ['https://www.youtube.com/watch?v=Kt99qMe6fnQ',        'Kt99qMe6fnQ'],
      ['https://www.youtube.com/watch?v=jj6MDv7XE1s',        'jj6MDv7XE1s'],
    ];

    for (const [input, expectedId] of realUrls) {
      expect(getYouTubeEmbedUrl(input)).toBe(`https://www.youtube.com/embed/${expectedId}`);
    }
  });

  // ── null / empty inputs ───────────────────────────────────────────────────

  it('returns null for null', () => {
    expect(getYouTubeEmbedUrl(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(getYouTubeEmbedUrl(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getYouTubeEmbedUrl('')).toBeNull();
  });

  // ── invalid / non-YouTube URLs ────────────────────────────────────────────

  it('returns null for a non-YouTube URL', () => {
    expect(getYouTubeEmbedUrl('https://vimeo.com/123456789')).toBeNull();
  });

  it('returns null for a plain http URL', () => {
    expect(getYouTubeEmbedUrl('https://example.com/watch?v=abc')).toBeNull();
  });

  it('returns null for a malformed string (not a URL)', () => {
    expect(getYouTubeEmbedUrl('not a url at all')).toBeNull();
  });

  it('returns null for a YouTube URL missing the v param', () => {
    expect(getYouTubeEmbedUrl('https://www.youtube.com/watch')).toBeNull();
  });

  it('returns null for a YouTube URL with empty v param', () => {
    expect(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=')).toBeNull();
  });

  it('returns null for a youtu.be URL with no path', () => {
    expect(getYouTubeEmbedUrl('https://youtu.be/')).toBeNull();
  });

  // ── embed URL shape ───────────────────────────────────────────────────────

  it('always returns an embed URL starting with https://www.youtube.com/embed/', () => {
    const result = getYouTubeEmbedUrl('https://www.youtube.com/watch?v=abc123');
    expect(result).toMatch(/^https:\/\/www\.youtube\.com\/embed\//);
  });

  it('never carries through the &t= timestamp into the embed URL', () => {
    const result = getYouTubeEmbedUrl('https://www.youtube.com/watch?v=abc123&t=90s');
    expect(result).toBe('https://www.youtube.com/embed/abc123');
    expect(result).not.toContain('t=');
  });
});
