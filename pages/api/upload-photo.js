import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dpny5syo1',
  api_key: '149883649324728',
  api_secret: 'ufUlX5J1tFu3a5xrZ3VcFA3gdyQ',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { file, folder } = req.body;

  if (!file) {
    return res.status(400).json({ error: 'Missing image data' });
  }

  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder || 'forgeiq',
    });

    res.status(200).json({ url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1000mb',
    },
  },
};
