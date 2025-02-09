import {
    verifyCloudProof,
    IVerifyResponse,
    ISuccessResult,
  } from "@worldcoin/minikit-js";
  
  interface IRequestPayload {
    payload: ISuccessResult;
    action: string;
    signal: string | undefined;
  }
  
  export async function verifyProof(
    payload: ISuccessResult,
    app_id: string,
    action: string,
    signal: string | undefined
  ): Promise<IVerifyResponse> {
    const verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signal
    )) as IVerifyResponse;
  
    console.log('verifyRes:', verifyRes);
    console.log('payload:', payload);
  
    return verifyRes;
  }