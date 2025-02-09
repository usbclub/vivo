import { NextRequest, NextResponse } from "next/server";
import { verifyProof } from "../../utils/verifyUtils"; // Adjust the path as necessary

export async function POST(req: NextRequest) {
  const { payload, action, signal } = (await req.json()) as IRequestPayload;
  const app_id = process.env.APP_ID as `app_${string}`;
  
  const verifyRes = await verifyProof(payload, app_id, action, signal);

  if (verifyRes.success) {
    return NextResponse.json({ verifyRes, status: 200 });
  } else {
    return NextResponse.json({ verifyRes, status: 400 });
  }
}


  // if (verifyRes.success) {
    // This is where you should perform backend actions if the verification succeeds
    // Such as, setting a user as "verified" in a database

    // TODO: 
    // - this user is verified 
    // - this user is current listening 
    // - this user is no longer listening 
    
    // norm opens app 
    // norm hits verify 
    // norm is then let in to listen 
    // norm's verified was marked for today, and the count increased by one 
    // norm closes the app, so the count decreases by one 
    // norm re-opens the app, so the count increases by one, and they were already verified so they can just start listening again 
    
    // the server has: 
    // {
    //    'user_id': ???,
    //    'timestamp': last_verified_time,
    //    'listening': true
    // }
    //
    // Every time you open, verify and send to server to open up audio stream. 
    // On backend, verify the proof (?) and then start audio stream. 


    // a list of users that have verified "today" (rolling last 24 hours) 

    // console.log('verifyRes:', verifyRes)
    // console.log('nullifier_hash')

//     return NextResponse.json({ verifyRes, status: 200 });
//   } else {
//     // This is where you should handle errors from the World ID /verify endpoint.
//     // Usually these errors are due to a user having already verified.
//     return NextResponse.json({ verifyRes, status: 400 });
//   }
