/*
  Code by Ruslan Magana Vsevolodovna
  This code is provided as-is and I am not responsible for its usage.
  For any inquiries, please contact me at contact@ruslanmv.com.
*/

import axios from 'axios';
import React, { useState, useEffect } from 'react';
import './MatrixTheme.css';
////////////
async function synthesizeSpeech(text) {
  if (!process.env.REACT_APP_GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY not found in the environment");
  }
  if (typeof text !== "string") {
    throw new Error(`Invalid input type: ${typeof text}. Type has to be text or SSML.`);
  }
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const apiURL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  const requestBody = {
    input: {
      text,
    },
    voice: { languageCode: 'en-US', name: 'en-US-Polyglot-1', ssmlGender: 'MALE' },
    //voice: { languageCode: 'en-US', name: 'en-US-Neural2-H', ssmlGender: 'FEMALE' },
    //voice: { languageCode: 'it-IT', name: 'it-IT-Standard-B', ssmlGender: 'FEMALE' },
    audioConfig: {
      audioEncoding: "MP3",
    },
  };
  const response = await fetch(apiURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google Cloud TTS API Error: ${errorData.error.message}`);
  }
  const responseData = await response.json();
  const audioContent = responseData.audioContent;

  return audioContent;
}




// Function to convert audio blob to base64 encoded string
const audioBlobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arrayBuffer = reader.result;
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      resolve(base64Audio);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};
/*
//Simple version gpt-3.5-turbo-instruct
async function sendMessageToChatGPT(inputText) {
  console.log(`ChatGPT message received: ${inputText}`);
  try {
    const response = await axios.post('https://api.openai.com/v1/completions', {
      model: 'gpt-3.5-turbo-instruct',
      prompt: inputText,
      max_tokens: 20,
      temperature: 0
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      }
    });
    console.log(`ChatGPT response :`,response);
    //console.log(response.data.choices[0].text.trim());
    const message = response.data.choices[0].text.trim();
    return message;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to send message to ChatGPT');
  }
}
*/

//Simple version gpt-3.5-turbo
async function sendMessageToChatGPT(inputText) {
  console.log(`ChatGPT message received: ${inputText}`);
  const MAX_WORD_SUGGESTION = 60;
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: "system", content: `You are a friendly and humorous assistant, providing users with a fun and engaging conversation. Keep your responses concise, no longer than ${MAX_WORD_SUGGESTION} words per response.` },
          { role: "user", content: inputText },
        ],
        max_tokens: 70,
        temperature: 0
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
      }
    );
    //console.log(`ChatGPT response :`, response);
    const message = response.data.choices[0].message.content.trim();
    return message;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to send message to ChatGPT');
  }
}

const App = () => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [messageAI, setMessageAI] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state
  const [audioContent, setAudioContent] = useState(null); // Added useState for audioContent
  // Cleanup function to stop recording and release media resources
  useEffect(() => {
    return () => {
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaRecorder]);

  if (!process.env.REACT_APP_GOOGLE_API_KEY) {
    throw new Error("REACT_APP_GOOGLE_API_KEY not found in the environment");
  }

  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.start();
      console.log('Recording started');

      // Event listener to handle data availability
      recorder.addEventListener('dataavailable', async (event) => {
        console.log('Data available event triggered');
        const audioBlob = event.data;

        const base64Audio = await audioBlobToBase64(audioBlob);
        //console.log('Base64 audio:', base64Audio);

        try {
          const startTime = performance.now();

          const response = await axios.post(
            `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
            {
              config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: 'en-US',
              },
              audio: {
                content: base64Audio,
              },
            }
          );

          const endTime = performance.now();
          const elapsedTime = endTime - startTime;

          //console.log('API response:', response);
          console.log('Voice Recognition - Time taken (ms):', elapsedTime);

          if (response.data.results && response.data.results.length > 0) {
            
            const transcription = response.data.results[0].alternatives[0].transcript;
            setTranscription(transcription);
            setIsLoading(true); // Set isLoading to true during processing
            const startTimeGPT = performance.now();

            //sendMessageToChatGPT(transcription).then((message) => {
            //  console.log(message);
            //  setMessageAI(message);
            //});
            const output = await sendMessageToChatGPT(transcription);
            console.log(output);
            setMessageAI(output);
            
            const endTimeGPT = performance.now();
            const elapsedTimeGPT = endTimeGPT - startTimeGPT;
            console.log('AI processing -  Time taken (ms):', elapsedTimeGPT);
            setIsLoading(false); // Set isLoading back to false after processing
            const synthesizedAudio = await synthesizeSpeech(output);
            setAudioContent(synthesizedAudio);
            const audio = new Audio(`data:audio/mp3;base64,${synthesizedAudio}`);
            audio.play();



          } else {
            console.log('No transcription results in the API response:', response.data);
            setTranscription('No transcription available');
          }
        } catch (error) {
          console.error('Error with Google Speech-to-Text API:', error.response.data);
        }
      });

      setRecording(true);
      setMediaRecorder(recorder);
    } catch (error) {
      console.error('Error getting user media:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      console.log('Recording stopped');
      setRecording(false);
    }
  };


 //OpenAI Theme
const default_mode = (
  <div style={{ background: '#F1F3F5', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'Roboto, sans-serif' }}>
    <h1 style={{ fontSize: '48px', color: '#3F51B5', marginBottom: '40px' }}>Speak with ChatGPT</h1>
    {!recording ? (
      <button onClick={startRecording} style={{ background: '#4A90E2', color: 'white', fontSize: '24px', padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 3px 5px rgba(0,0,0,0.3)' }}>Start Recording</button>
    ) : (
      <button onClick={stopRecording} style={{ background: '#F87676', color: 'white', fontSize: '24px', padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 3px 5px rgba(0,0,0,0.3)' }}>Stop Recording</button>
    )}
    <p style={{ fontSize: '24px', color: '#212121', maxWidth: '80%', lineHeight: '1.5', textAlign: 'left', background: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>User: {transcription}</p>
    {isLoading ? (
      <div style={{ fontSize: '24px', color: '#212121', maxWidth: '80%', lineHeight: '1.5', textAlign: 'left', background: '#4CAF50', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
         <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>Processing...</span> {/* Added styling to the processing icon */}
      </div>
    ) : (
      <p style={{ fontSize: '24px', color: '#212121', maxWidth: '80%', lineHeight: '1.5', textAlign: 'left', background: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>AI: {messageAI}</p>
    )}
  </div>
);
 //Matrix Theme
const matrix_mode = (
  <div style={{ background: '#000000', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'Courier New, monospace' }}>
    <h1 style={{ fontSize: '48px', color: '#00FF00', marginBottom: '40px' }}>Speak with ChatGPT</h1>
    {!recording ? (
      <button onClick={startRecording} style={{ background: '#000000', color: '#00FF00', fontSize: '24px', padding: '10px 20px', borderRadius: '5px', border: '2px solid #00FF00', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 3px 5px rgba(0,255,0,0.3)' }}>Start Recording</button>
    ) : (
      <button onClick={stopRecording} style={{ background: '#000000', color: '#00FF00', fontSize: '24px', padding: '10px 20px', borderRadius: '5px', border: '2px solid #00FF00', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 3px 5px rgba(0,255,0,0.3)' }}>Stop Recording</button>
    )}
    <p style={{ fontSize: '24px', color: '#00FF00', maxWidth: '80%', lineHeight: '1.5', textAlign: 'left', background: '#000000', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,255,0,0.2)' }}>User: {transcription}</p>
    {isLoading ? (
      <div style={{ fontSize: '24px', color: '#00FF00', maxWidth: '80%', lineHeight: '1.5', textAlign: 'left', background: '#000000', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,255,0,0.2)' }}>
         <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#00FF00', textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>Processing...</span> {/* Added styling to the processing icon */}
      </div>
    ) : (
      <p style={{ fontSize: '24px', color: '#00FF00', maxWidth: '80%', lineHeight: '1.5', textAlign: 'left', background: '#000000', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,255,0,0.2)' }}>AI: {messageAI}</p>
    )}
  </div>
);


const matrix_animated = (
<div style={{ position: 'relative', zIndex: 1, background: '#000000', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'Courier New, monospace' }}>    
<div className="matrix-background">
      {Array(100).fill(null).map((_, index) => (
        <span key={index} style={{ animationDuration: `${Math.random() * 5 + 3}s`, animationDelay: `${Math.random() * 3}s`, left: `${index * 20}px`, top: `${Math.random() * 100}vh` }}>1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0</span>
      ))}
    </div>
    <h1 style={{ fontSize: '48px', color: '#00FF00', marginBottom: '40px', fontFamily: '"Matrix Code NFI", monospace' }}>Speak with ChatGPT</h1>
    {!recording ? (
      <button onClick={startRecording} style={{ background: '#000000', color: '#00FF00', fontSize: '24px', padding: '10px 20px', borderRadius: '5px', border: '2px solid #00FF00', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 3px 5px rgba(0,255,0,0.3)' }}>Start Recording</button>
    ) : (
      <button onClick={stopRecording} style={{ background: '#000000', color: '#00FF00', fontSize: '24px', padding: '10px 20px', borderRadius: '5px', border: '2px solid #00FF00', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 3px 5px rgba(0,255,0,0.3)' }}>Stop Recording</button>
    )}
    <p style={{ fontSize: '24px', color: '#00FF00', maxWidth: '80%', lineHeight: '1.5', textAlign: 'left', background: '#000000', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,255,0,0.2)' }}>User: {transcription}</p>
    {isLoading ? (
      <div style={{ fontSize: '24px', color: '#00FF00', maxWidth: '80%', lineHeight: '1.5', textAlign: 'left', background: '#000000', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,255,0,0.2)' }}>
         <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#00FF00', textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>Processing...</span>
      </div>
    ) : (
      <p style={{ fontSize: '24px', color: '#00FF00', maxWidth: '80%', lineHeight: '1.5', textAlign: 'left', background: '#000000', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,255,0,0.2)' }}>AI: {messageAI}</p>
    )}
  </div>
);


return (matrix_animated);
};
export default App;