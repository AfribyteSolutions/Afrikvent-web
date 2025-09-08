"use client";

import React, { useEffect, useRef, useState } from "react";
import VideoSlide from "./VideoSlide";
import SearchBar from "@/components/searchbar/SearchBar"

type Slide = {
  src: string;
  poster?: string;
  title?: string;
  loop?: boolean;
};

type VideoSliderProps = {
  slides: Slide[];
  interval?: number;
  transitionDuration?: number;
  pauseOnHover?: boolean;
};

const VideoSlider: React.FC<VideoSliderProps> = ({
  slides,
  interval = 4000,
  transitionDuration = 0.4,
  pauseOnHover = false, // full screen, probably no hover pause needed
}) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = slides.length;

  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, interval);

    return () => clearInterval(id);
  }, [interval, total, isPaused]);

  // Play active video, pause others
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === current) {
        v.currentTime = 0;
        const playPromise = v.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch(() => {});
        }
      } else {
        v.pause();
      }
    });
  }, [current]);

  const trackStyle: React.CSSProperties = {
    transform: `translateX(-${current * 100}%)`,
    transition: `transform ${transitionDuration}s ease`,
    width: `${total * 100}%`,
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      style={{ backgroundColor: "black" }}
    >
      <div
        className="flex w-full h-full z-0"
        style={trackStyle}
        role="list"
        aria-roledescription="carousel"
      >
        {slides.map((s, i) => (
          <div
            key={s.src + i}
            className="w-full h-screen flex-shrink-0"
            role="listitem"
            aria-hidden={i !== current}
          >
            <VideoSlide
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              src={s.src}
              poster={s.poster}
              title={s.title}
              onEnded={() => setCurrent((prev) => (prev + 1) % total)}
              loop={s.loop ?? false}

            />
          </div>
        ))}
      </div>


    {/* Centered Overlay Content */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
        {/** This is where SearchBar will render */}
            <div className="w-full max-w-2xl px-4">
                <SearchBar />
            </div>
        </div>
    </div>
  );
};

export default VideoSlider;
