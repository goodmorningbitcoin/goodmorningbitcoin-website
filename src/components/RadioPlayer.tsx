import { Play, Pause, Volume2, VolumeX, Radio, Users, Music, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { cn } from '@/lib/utils';

export function RadioPlayer({ className }: { className?: string }) {
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

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (isMuted && value[0] > 0) {
      toggleMute();
    }
  };

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const switchToRadio = () => {
    setCurrentSource({
      type: 'radio',
      url: 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3',
      title: 'Good Morning Bitcoin Radio',
      artist: 'Live Stream',
    });
  };

  const progressPercentage = isRadio && nowPlaying 
    ? (nowPlaying.now_playing.elapsed / nowPlaying.now_playing.duration) * 100
    : isPodcast && duration > 0
    ? (currentTime / duration) * 100
    : 0;

  return (
    <Card className={cn("w-full bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800", className)}>
      <CardContent className="p-6">
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
          <div className="flex items-center gap-3">
            {isRadio && nowPlaying && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{nowPlaying.listeners.current} listening</span>
              </div>
            )}
            {/* Compact Volume Control */}
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

        <div className="space-y-4">
          {isRadio && isLoading ? (
            <>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : currentSource ? (
            <>
              <div>
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
      </CardContent>
    </Card>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}