import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown, Volume2, VolumeX, Radio, Users, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { BoostButton } from '@/components/BoostButton';

export function CompactAudioPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: nowPlaying, isLoading } = useNowPlaying();
  const {
    currentSource,
    setCurrentSource,
    isPlaying,
    togglePlay,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    currentTime,
    duration,
    seek,
  } = useAudioPlayer();

  const isRadio = currentSource?.type === 'radio';
  const isPodcast = currentSource?.type === 'podcast';

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (isMuted && value[0] > 0) {
      toggleMute();
    }
  };

  const switchToRadio = () => {
    setCurrentSource({
      type: 'radio',
      url: 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3',
      title: 'Good Morning Bitcoin Radio',
      artist: 'Live Stream',
    });
  };

  // Always show the player bar for consistency

  const progressValue = isPodcast && duration > 0 
    ? currentTime 
    : isRadio && nowPlaying?.now_playing.duration 
    ? (nowPlaying.now_playing.elapsed / nowPlaying.now_playing.duration) * 100
    : 0;

  const maxValue = isPodcast && duration > 0 
    ? duration 
    : 100;

  const progressPercentage = isRadio && nowPlaying 
    ? (nowPlaying.now_playing.elapsed / nowPlaying.now_playing.duration) * 100
    : isPodcast && duration > 0
    ? (currentTime / duration) * 100
    : 0;

  return (
    <div className={`bg-background border-t border-border transition-all duration-300 ${isExpanded ? 'h-auto' : 'h-16'}`}>
      {/* Compact View - only show when not expanded */}
      {!isExpanded && (
        <div className="h-16 flex items-center px-4 gap-4">
        {/* Far left: Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            disabled
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="default"
            onClick={togglePlay}
            className="h-10 w-10 bg-orange-500 hover:bg-orange-600"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            disabled
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Title */}
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            {currentSource?.title || 'Good Morning Bitcoin'}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {currentSource?.artist || 'Click play to start listening'}
            {isPodcast && currentSource?.type === 'podcast' && currentSource.showTitle && (
              <span> • {currentSource.showTitle}</span>
            )}
          </div>
        </div>

        {/* Scrubber - twice as big */}
        <div className="w-64 sm:w-96">
          {isPodcast && currentSource ? (
            <Slider
              value={[progressValue]}
              onValueChange={handleSeek}
              max={maxValue}
              step={1}
              className="cursor-pointer"
            />
          ) : (
            <div className="w-full bg-secondary rounded-full h-1">
              <div 
                className="bg-orange-500 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          )}
        </div>

        {/* Spacer to push right elements to far right */}
        <div className="flex-1"></div>

        {/* Back to Radio (if podcast) */}
        {isPodcast && (
          <Button
            size="sm"
            variant="ghost"
            onClick={switchToRadio}
            className="text-xs"
          >
            Back to Radio
          </Button>
        )}

        {/* Boost button (left of expand button) */}
        <BoostButton
          size="icon"
          variant="ghost"
          iconOnly
          className="h-8 w-8"
        />

        {/* Far right: Expand button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-t border-orange-200 dark:border-orange-800 p-6">
          {/* Header with live radio/podcast indicator and collapse button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isRadio ? (
                  <>
                    <Radio className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      LIVE RADIO
                    </span>
                  </>
                ) : (
                  <>
                    <Music className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      PODCAST
                    </span>
                  </>
                )}
              </div>
              {!isRadio && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={switchToRadio}
                  className="text-xs"
                >
                  Back to Radio
                </Button>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {isRadio && isLoading ? (
              <>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </>
            ) : currentSource ? (
              <>
                {/* Title section with artwork, text, and controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Artwork */}
                    <div className="w-12 h-12 rounded flex-shrink-0 overflow-hidden">
                      {isRadio && nowPlaying?.now_playing.song.art ? (
                        <img 
                          src={nowPlaying.now_playing.song.art}
                          alt="Now playing artwork"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-orange-200 dark:bg-orange-800 rounded flex items-center justify-center ${
                        isRadio && nowPlaying?.now_playing.song.art ? 'hidden' : ''
                      }`}>
                        {isRadio ? (
                          <Radio className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <Music className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Title and artist */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                        {currentSource.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {currentSource.artist}
                        {isPodcast && currentSource.type === 'podcast' && currentSource.showTitle && (
                          <span className="text-xs"> • {currentSource.showTitle}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right side controls */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Listener count */}
                    {isRadio && nowPlaying && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{nowPlaying.listeners.current} listening</span>
                      </div>
                    )}
                    
                    {/* Boost button */}
                    <BoostButton
                      size="sm"
                      variant="outline"
                      className="h-8"
                    />
                    
                    {/* Volume Control */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleMute}
                        className="h-6 w-6"
                      >
                        {isMuted ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="w-32"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-full hover:bg-orange-100 dark:hover:bg-orange-800"
                      disabled
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="default"
                      onClick={togglePlay}
                      className="h-12 w-12 rounded-full bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6 ml-0.5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-full hover:bg-orange-100 dark:hover:bg-orange-800"
                      disabled
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>

                  {(isRadio && nowPlaying?.now_playing.duration && nowPlaying.now_playing.duration > 0) || 
                   (isPodcast && duration > 0) ? (
                    <div className="flex-1 space-y-1">
                      {isPodcast ? (
                        <Slider
                          value={[currentTime]}
                          onValueChange={handleSeek}
                          max={duration}
                          step={1}
                          className="cursor-pointer"
                        />
                      ) : (
                        <Progress value={progressPercentage} className="h-2" />
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {isPodcast 
                            ? formatTime(currentTime)
                            : isRadio && nowPlaying 
                            ? formatTime(nowPlaying.now_playing.elapsed)
                            : '0:00'}
                        </span>
                        <span>
                          {isPodcast 
                            ? formatTime(duration)
                            : isRadio && nowPlaying 
                            ? formatTime(nowPlaying.now_playing.duration)
                            : '0:00'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full hover:bg-orange-100 dark:hover:bg-orange-800"
                    disabled
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="default"
                    onClick={togglePlay}
                    className="h-12 w-12 rounded-full bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-0.5" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full hover:bg-orange-100 dark:hover:bg-orange-800"
                    disabled
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Good Morning Bitcoin</h3>
                  <p className="text-sm text-muted-foreground">Click play to start listening</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}