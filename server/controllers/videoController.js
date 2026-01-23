import Video from '../models/Video.js';
import Course from '../models/Course.js';

export const uploadVideo = async (req, res) => {
  try {
    const { title, description, videoOrder, transcript } = req.body;
    const { courseId } = req.params;
    let videoUrl = req.body.url;

    // If file was uploaded, use file path
    if (req.file) {
      videoUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
    }

    if (!title || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title and video URL are required',
        error: 'VALIDATION_ERROR',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        error: 'NOT_FOUND',
      });
    }

    const video = new Video({
      course: courseId,
      title,
      description,
      url: videoUrl,
      videoOrder: videoOrder || 1,
      transcript: transcript || '',
    });

    await video.save();

    // Add video to course
    course.videos.push(video._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getVideosByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const videos = await Video.find({ course: courseId }).sort('videoOrder');

    res.json({
      success: true,
      videos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId).populate('course');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
        error: 'NOT_FOUND',
      });
    }

    // Increment views
    video.views += 1;
    await video.save();

    res.json({
      success: true,
      video,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.videoId,
      req.body,
      { new: true }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
        error: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      message: 'Video updated successfully',
      video,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
        error: 'NOT_FOUND',
      });
    }

    // Remove from course
    await Course.updateOne(
      { _id: video.course },
      { $pull: { videos: video._id } }
    );

    res.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};
