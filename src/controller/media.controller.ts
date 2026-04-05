import { Router, Request, Response } from 'express';
import { getMediaById } from '../services/media.service';

const mediaController = Router();

mediaController.get('/:id', async (req: Request, res: Response) => {
  try {
    console.log("Fetching media with ID:", req.params.id);
    
    const media = await getMediaById(req.params.id);
    console.log("Media found ", media);
    
    res.set('Content-Type', media.img.contentType);
    res.send(media.img.data);
  } catch (error: any) {
    console.error('Error serving media:', error);
    res.status(404).json({ error: error.message });
  }
});

export default mediaController;

