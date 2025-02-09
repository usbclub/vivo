import { PayBlock } from "@/components/Pay";
import { SignIn } from "@/components/SignIn";
import { VerifyBlock } from "@/components/Verify";
import { VerifyWithAudio } from "@/components/VerifyWithAudio";
// import { ThumbTracker } from "@/components/ThumbTracker";
import { LiveCount } from "@/components/LiveCount"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* <ThumbTracker /> */}
      {/* <LiveCount /> */}
      {/* <SignIn /> */}
      <VerifyWithAudio />
      {/* <PayBlock /> */}
    </main>
  );
}
