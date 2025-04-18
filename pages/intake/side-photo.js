import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SidePhotoUpload() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUrl = localStorage.getItem('sidePhotoUrl');
      if (storedUrl) setPreviewUrl(storedUrl);
    }
  }, []);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploading(true);
      try {
        const res = await fetch('/api/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result, folder: 'forgeiq' }),
        });

        let data;
        try {
          data = await res.json();
        } catch (err) {
          console.error('❌ Failed to parse JSON from response:', err);
          const text = await res.text();
          console.error('💬 Raw response:', text);
          return;
        }

        if (data.url) {
          localStorage.setItem('sidePhotoUrl', data.url);
          setPreviewUrl(data.url);
          setUploadSuccess(true);
        } else {
          console.error('❌ Upload failed:', data.error || 'No URL returned');
        }
      } catch (err) {
        console.error('❌ Upload error:', err);
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(uploadedFile);
  };

  const handleContinue = () => {
    if (!uploadSuccess) return alert('Upload not completed yet!');
    router.push('/intake/back-photo');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-3xl font-bold text-orange-500 mb-6">Upload Side Physique Photo</h1>
      <div className="flex flex-col items-center">
        <label className="block text-center mb-2 font-semibold">Upload Your Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-orange-600 file:text-white hover:file:bg-orange-700"
        />
        {file && <p className="text-sm text-green-400 mt-2">Selected: {file.name}</p>}
        {uploading && <p className="text-sm text-yellow-400 mt-2 animate-pulse">Uploading...</p>}
        {previewUrl && (
          <div className="mt-6 w-full max-w-xs bg-zinc-800 p-4 rounded-lg shadow-md flex flex-col items-center">
            <img
              src={previewUrl}
              alt="Uploaded side pose"
              className="w-40 rounded border border-gray-500 mb-4"
            />
            <button
              onClick={() => {
                localStorage.removeItem('sidePhotoUrl');
                setPreviewUrl(null);
                setUploadSuccess(false);
                setFile(null);
              }}
              className="text-sm text-red-400 underline hover:text-red-300"
            >
              Replace Photo
            </button>
          </div>
        )}
      </div>
      <button
        onClick={handleContinue}
        className="mt-8 bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded font-semibold"
      >
        Continue
      </button>
    </div>
  );
}