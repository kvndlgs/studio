import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function uploadAudioToFirebase(audioBuffer: Buffer, battleId: string): Promise<string> {
  const storage = getStorage();
  const storageRef = ref(storage, `battle_audio/${battleId}/mixed_audio.mp3`);

  try {
    // Upload the audio buffer
    const snapshot = await uploadBytes(storageRef, audioBuffer);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading audio to Firebase Storage:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}