import Note from '../models/Note.js';
import Course from '../models/Course.js';
import cloudinary from '../config/cloudinary.js';

export const uploadNote = async (req, res) => {
  try {
    const { title, description } = req.body;
    const { courseId } = req.params;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required', error: 'VALIDATION_ERROR' });
    }

    if (!req.file && !req.body.url) {
      return res.status(400).json({ success: false, message: 'Note file or URL is required', error: 'VALIDATION_ERROR' });
    }

    let noteUrl = req.body.url || '';
    let fileType = '';

    if (req.file) {
      if (!req.file.buffer) {
        return res.status(400).json({ success: false, message: 'Uploaded file is missing', error: 'INVALID_FILE' });
      }

      // upload raw to Cloudinary (for PDF etc.)
      const streamifier = await import('streamifier');
      const streamUpload = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              folder: 'skillexchange_notes',
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.default.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      const uploadResult = await streamUpload();
      noteUrl = uploadResult.secure_url;
      fileType = req.file.mimetype;
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found', error: 'NOT_FOUND' });

    // Check if user is the course owner
    if (course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload notes to this course',
        error: 'FORBIDDEN',
      });
    }

    const note = new Note({ course: courseId, title, description: description || '', url: noteUrl, fileType });
    await note.save();

    course.notes = course.notes || [];
    course.notes.push(note._id);
    await course.save();

    res.status(201).json({ success: true, message: 'Note uploaded', note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, error: 'SERVER_ERROR' });
  }
};

export const getNotesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const notes = await Note.find({ course: courseId }).sort('-uploadedAt');
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, error: 'SERVER_ERROR' });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found', error: 'NOT_FOUND' });

    // Check if user is the course owner
    const course = await Course.findById(note.course);
    if (course && course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this note',
        error: 'FORBIDDEN',
      });
    }

    await Note.findByIdAndDelete(noteId);

    // remove reference from course
    await Course.findByIdAndUpdate(note.course, { $pull: { notes: note._id } });

    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, error: 'SERVER_ERROR' });
  }
};
