"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";

export const SignIn = () => {
  const { data: session } = useSession();
  if (session) {
    return (
      <>
        Signed in as {session?.user?.name?.slice(0, 10)} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  } else {
    return (
      <>
        <Button
          onClick={function Ki(){}}
          radius="md"
          size="md"
          variant="primary"
        >
          Button
        </Button>

        Not signed in <br />
        <button onClick={() => signIn()}>Sign in</button>
      </>
    );
  }
};
