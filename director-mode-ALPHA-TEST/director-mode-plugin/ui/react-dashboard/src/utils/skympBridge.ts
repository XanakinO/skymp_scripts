const sendToSkymp = (type: string, data: any) => {
  console.log('Sending to SkyMP:', type, data);
  if ((window as any).skyrimPlatform) {
    (window as any).skyrimPlatform.sendMessage({ type, data });
  }
};

export { sendToSkymp };
