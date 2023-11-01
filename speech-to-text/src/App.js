import axios from 'axios';
import React, { useState } from 'react';
const App = () => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcription, setTranscription] = useState('');
  if (!process.env.REACT_APP_GOOGLE_API_KEY) {
    throw new Error("REACT_APP_GOOGLE_API_KEY not found in the environment");
  }
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.start();

    recorder.addEventListener('dataavailable', async (event) => {
      const audioBlob = event.data;
      //const audioUrl = URL.createObjectURL(audioBlob);
      try {
        const response = await axios.post(
          `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
          {
            config: {
              encoding: 'LINEAR16',
              sampleRateHertz: 16000,
              languageCode: 'en-US',
            },
            audio: {
              content: audioBlobToBase64(audioBlob),
            },
          }
        );
        setTranscription(response.data.results[0].alternatives[0].transcript);
      } catch (error) {
        console.error(error);
      }
    });

    setRecording(true);
    setMediaRecorder(recorder);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const audioBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div>
      <h1>Speech to Text</h1>
      {!recording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording}>Stop Recording</button>
      )}
      <p>Transcription: {transcription}</p>
    </div>
  );
};

export default App;