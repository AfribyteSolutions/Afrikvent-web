"use client";
import React, { forwardRef } from "react";

type VideoSlideProps = {
  src: string;
  poster?: string;
  title?: string;
  loop?: boolean;
  muted?: boolean;
  onEnded?: () => void;
  style?: React.CSSProperties;
};

const VideoSlide = forwardRef<HTMLVideoElement, VideoSlideProps>(
  ({ src, poster, title, loop, muted = true, onEnded, style }, ref) => {
    return (
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted={muted}
        loop={loop}
        playsInline
        onEnded={onEnded}
        autoPlay
        aria-label={title ?? "video slide"}
        style={style}
      />
    );
  }
);

VideoSlide.displayName = "VideoSlide";
export default VideoSlide;
