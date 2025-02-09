import { useSpring, animated } from "@react-spring/web";

interface AudioVisualizerProps {
  volume: number;
  lowFreq: number;
  midFreq: number;
  highFreq: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ volume, lowFreq, midFreq, highFreq }) => {
  const lowWave = useSpring({ height: `${10 + lowFreq}%`, config: { tension: 200, friction: 20 } });
  const midWave = useSpring({ height: `${10 + midFreq}%`, config: { tension: 180, friction: 18 } });
  const highWave = useSpring({ height: `${10 + highFreq}%`, config: { tension: 160, friction: 16 } });
  const volumeScale = useSpring({ transform: `scale(${1 + volume / 300})`, config: { tension: 150, friction: 15 } });

  return (
    <animated.div className="absolute inset-0 flex items-center justify-center gap-2" style={volumeScale}>
      {/* Low Frequencies (Red) */}
      <animated.div className="w-8 bg-red-500 rounded-full" style={{ ...lowWave, width: "20px" }} />
      <animated.div className="w-8 bg-red-600 rounded-full" style={{ ...lowWave, width: "24px" }} />

      {/* Mid Frequencies (Yellow) */}
      <animated.div className="w-8 bg-yellow-500 rounded-full" style={{ ...midWave, width: "20px" }} />
      <animated.div className="w-8 bg-yellow-600 rounded-full" style={{ ...midWave, width: "24px" }} />

      {/* High Frequencies (Blue) */}
      <animated.div className="w-8 bg-blue-500 rounded-full" style={{ ...highWave, width: "20px" }} />
      <animated.div className="w-8 bg-blue-600 rounded-full" style={{ ...highWave, width: "24px" }} />
    </animated.div>
  );
};

export default AudioVisualizer;
