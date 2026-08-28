import React, { useState, useEffect, useRef } from 'react';
import { Camera, MessageCircle, MonitorPlay, Globe, Music, Headphones, Link2, Play } from 'lucide-react';
import { fetchArtistDetails } from '../../../api/musicbrainz/genreApi';
import SidebarAudioPlayer from '../components/SidebarAudioPlayer';
import VinylCover from '../../visual/VinylCover/VinylCover';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';

export default function MusicDetails({ item }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [artistDetail, setArtistDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const updateActiveSidebarItem = useSidebarStore(state => state.updateActiveSidebarItem);

  const detailTimerRef = useRef(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    setIsPlaying(false);
    setArtistDetail(null);

    let targetMbid = item?.mbid || '';
    let targetArtistName = item?.title || '';

    if (item.itemType === 'music') {
      targetMbid = ''; // Track mbid is not artist mbid
      targetArtistName = item?.mediaMeta?.contributors?.[0]?.name || '';
      if (!targetArtistName) return;
    } else if (item.itemType !== 'music_artist') {
      return;
    }

    if (detailTimerRef.current) clearTimeout(detailTimerRef.current);

    detailTimerRef.current = setTimeout(async () => {
      if (isFetchingRef.current) return;
      
      isFetchingRef.current = true;
      setIsDetailLoading(true);

      const result = await fetchArtistDetails(targetMbid, targetArtistName);
      setArtistDetail(result?.data || null);

      if (result?.data) {
        updateActiveSidebarItem({ artistDetail: result.data });
      }

      setIsDetailLoading(false);
      isFetchingRef.current = false;
    }, 500);

    return () => clearTimeout(detailTimerRef.current);
  }, [item?.mbid, item?.title, item?.itemType, item?.id]);



  return (
    <>
      <div className="rs-media-container">
        {(item.coverImages?.[0] || item.image_url) ? (
          <VinylCover imageUrl={item.coverImages?.[0] || item.image_url} isPlaying={isPlaying} />
        ) : (
          <div className="rs-cover-placeholder">🎵</div>
        )}
      </div>

      <SidebarAudioPlayer
        item={item}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="rs-context-area">
        <p className="rs-synopsis">
          {item.review || 'No synopsis or lyrics provided for this track.'}
        </p>

        {item.itemType === 'music' && item.mediaMeta?.trackLinks && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', marginBottom: '24px' }}>
            <a
              href={`https://open.spotify.com/search/${encodeURIComponent(item.title + ' ' + (item.mediaMeta?.contributors?.[0]?.name || ''))}`}
              target="_blank"
              rel="noreferrer"
              className="rs-link-box-full rs-link-spotify"
            >
              <Headphones size={18} />
              <span>Listen on Spotify</span>
            </a>
            {item.mediaMeta.trackLinks.apple && (
              <a
                href={item.mediaMeta.trackLinks.apple}
                target="_blank"
                rel="noreferrer"
                className="rs-link-box-full rs-link-apple"
              >
                <Music size={18} />
                <span>Listen on Apple Music</span>
              </a>
            )}
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' ' + (item.mediaMeta?.contributors?.[0]?.name || ''))}`}
                target="_blank"
                rel="noreferrer"
                className="rs-link-box-full rs-link-youtube"
              >
                <MonitorPlay size={18} />
                <span>Search on YouTube</span>
              </a>
              {item.mediaMeta.trackLinks.lastfm && (
                <a
                  href={item.mediaMeta.trackLinks.lastfm}
                  target="_blank"
                  rel="noreferrer"
                  className="rs-link-box-full rs-link-default"
                  style={{ backgroundColor: '#d51007', color: 'white', border: 'none' }}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '6px' }}>Last.fm</span>
                  <span>View Track Details & Reviews</span>
                </a>
              )}
            </div>
          )}

        {(item.itemType === 'music_artist' || item.itemType === 'music') && (
          <div className="rs-artist-details" style={{ marginTop: '16px' }}>
            {item.itemType === 'music' && (
              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                About {item.mediaMeta?.contributors?.[0]?.name}
              </h3>
            )}
            {isDetailLoading && <p className="rs-loading-text" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>⏳ Loading artist info...</p>}

            {artistDetail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {artistDetail.musicbrainz?.['begin-area']?.name && (
                    <span>📍 {artistDetail.musicbrainz['begin-area'].name}{artistDetail.musicbrainz.country ? `, ${artistDetail.musicbrainz.country}` : ''}</span>
                  )}
                  {artistDetail.musicbrainz?.['life-span']?.begin && (
                    <span>📅 Since {artistDetail.musicbrainz['life-span'].begin.substring(0, 4)}</span>
                  )}
                  {artistDetail.lastfm?.artist?.ontour === "1" && (
                    <span style={{ color: '#1db954', fontWeight: 'bold' }}>🎤 On Tour</span>
                  )}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  👥 {Number(artistDetail.lastfm?.artist?.stats?.listeners || 0).toLocaleString()} listeners
                  <span style={{ margin: '0 8px' }}>•</span>
                  ▶️ {Number(artistDetail.lastfm?.artist?.stats?.playcount || 0).toLocaleString()} plays
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {artistDetail.musicbrainz?.tags?.slice(0, 5).map(tag => (
                    <span key={tag.name} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                      {tag.name}
                    </span>
                  ))}
                </div>

                {artistDetail.lastfm?.artist?.bio?.summary && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {artistDetail.lastfm.artist.bio.summary.replace(/<a[^>]*>.*?<\/a>/gi, '').trim()}
                  </p>
                )}

                {artistDetail.musicbrainz?.relations && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    {artistDetail.musicbrainz.relations
                      .filter(r => ['social network', 'official homepage', 'free streaming', 'streaming'].includes(r.type))
                      .map((link, idx) => {
                        let linkName = link.type.replace('free ', '');
                        let Icon = Link2;
                        let themeClass = 'rs-link-default';

                        if (link.url?.resource?.includes('spotify')) {
                          linkName = 'Spotify';
                          Icon = Headphones;
                          themeClass = 'rs-link-spotify';
                        } else if (link.url?.resource?.includes('apple')) {
                          linkName = 'Apple Music';
                          Icon = Music;
                          themeClass = 'rs-link-apple';
                        } else if (link.url?.resource?.includes('instagram')) {
                          linkName = 'Instagram';
                          Icon = Camera;
                          themeClass = 'rs-link-instagram';
                        } else if (link.url?.resource?.includes('twitter') || link.url?.resource?.includes('x.com')) {
                          linkName = 'Twitter';
                          Icon = MessageCircle;
                          themeClass = 'rs-link-twitter';
                        } else if (link.url?.resource?.includes('youtube')) {
                          linkName = 'YouTube';
                          Icon = MonitorPlay;
                          themeClass = 'rs-link-youtube';
                        } else if (link.type === 'official homepage') {
                          linkName = 'Website';
                          Icon = Globe;
                          themeClass = 'rs-link-website';
                        } else {
                          try {
                            const domain = new URL(link.url.resource).hostname.replace('www.', '').replace('music.', '').split('.')[0];
                            linkName = domain;
                          } catch (e) { }
                          linkName = linkName.charAt(0).toUpperCase() + linkName.slice(1);
                        }

                        return (
                          <a
                            key={idx}
                            href={link.url?.resource}
                            target="_blank"
                            rel="noreferrer"
                            className={`rs-link-box-full ${themeClass}`}
                          >
                            <Icon size={18} />
                            <span style={{ textTransform: 'capitalize' }}>{linkName}</span>
                          </a>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
