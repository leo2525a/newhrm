import { Request, Response } from 'express';
import Document from '../models/Document';
import mongoose from 'mongoose';

// @desc    Get all documents for an employee
// @route   GET /api/documents/employee/:employeeId
// @access  Private
export const getEmployeeDocuments = async (req: Request, res: Response) => {
  try {
    const employeeId = req.params.employeeId;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (employeeId !== req.user.employeeId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view these documents'
        });
      }
    }

    const documents = await Document.find({ employeeId })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ uploadedAt: -1 });

    // Filter out confidential docs for non-admin/manager
    const filteredDocuments = req.user.role === 'admin' || req.user.role === 'manager'
      ? documents
      : documents.filter(doc => !doc.isConfidential);

    res.json({
      success: true,
      count: filteredDocuments.length,
      data: filteredDocuments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get my documents
// @route   GET /api/documents/my-documents
// @access  Private
export const getMyDocuments = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked'
      });
    }

    const documents = await Document.find({ employeeId })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ uploadedAt: -1 });

    // Filter out confidential
    const filteredDocuments = documents.filter(doc => !doc.isConfidential);

    res.json({
      success: true,
      count: filteredDocuments.length,
      data: filteredDocuments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req: Request, res: Response) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email')
      .populate('uploadedBy', 'firstName lastName');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (document.employeeId._id.toString() !== req.user.employeeId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this document'
        });
      }
      if (document.isConfidential) {
        return res.status(403).json({
          success: false,
          message: 'This document is confidential'
        });
      }
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Upload new document
// @route   POST /api/documents
// @access  Private/Manager or Admin
export const createDocument = async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      title,
      description,
      documentType,
      fileUrl,
      fileType,
      fileSize,
      tags,
      isConfidential,
      expiryDate
    } = req.body;

    const document = await Document.create({
      employeeId,
      title,
      description,
      documentType,
      fileUrl,
      fileType,
      fileSize,
      tags: tags || [],
      isConfidential: isConfidential || false,
      expiryDate,
      uploadedBy: req.user._id
    });

    const populatedDocument = await document.populate(
      'employeeId',
      'firstName lastName email'
    );

    res.status(201).json({
      success: true,
      data: populatedDocument
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Upload new version of document
// @route   PUT /api/documents/:id/new-version
// @access  Private/Manager or Admin
export const uploadNewVersion = async (req: Request, res: Response) => {
  try {
    const { fileUrl, fileType, fileSize } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Save current version to previous versions
    document.previousVersions.push({
      version: document.version,
      fileUrl: document.fileUrl,
      uploadedAt: document.uploadedAt
    });

    // Update to new version
    document.version += 1;
    document.fileUrl = fileUrl;
    document.fileType = fileType;
    document.fileSize = fileSize;
    document.uploadedAt = new Date();

    await document.save();

    const updatedDocument = await Document.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email')
      .populate('uploadedBy', 'firstName lastName');

    res.json({
      success: true,
      message: `New version ${document.version} uploaded`,
      data: updatedDocument
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Update document metadata
// @route   PUT /api/documents/:id
// @access  Private/Manager or Admin
export const updateDocument = async (req: Request, res: Response) => {
  try {
    let document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Don't allow updating file info through this endpoint
    const { title, description, documentType, tags, isConfidential, expiryDate } = req.body;

    document = await Document.findByIdAndUpdate(
      req.params.id,
      { title, description, documentType, tags, isConfidential, expiryDate },
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'firstName lastName email')
      .populate('uploadedBy', 'firstName lastName');

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private/Admin
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    await document.deleteOne();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get all documents (admin) filtered by type
// @route   GET /api/documents
// @access  Private/Admin
export const getAllDocuments = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.documentType) {
      filter.documentType = req.query.documentType as string;
    }
    if (req.query.employeeId) {
      filter.employeeId = new mongoose.Types.ObjectId(req.query.employeeId as string);
    }
    if (req.query.expiringWithinDays) {
      const days = parseInt(req.query.expiringWithinDays as string);
      const date = new Date();
      date.setDate(date.getDate() + days);
      filter.expiryDate = { $lte: date, $gte: new Date() };
    }

    const documents = await Document.find(filter)
      .populate('employeeId', 'firstName lastName email department')
      .populate('uploadedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ uploadedAt: -1 });

    const total = await Document.countDocuments(filter);

    res.json({
      success: true,
      count: documents.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get documents expiring soon (admin)
// @route   GET /api/documents/expiring/:days
// @access  Private/Admin
export const getExpiringDocuments = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const documents = await Document.find({
      expiryDate: {
        $lte: endDate,
        $gte: new Date()
      }
    })
      .populate('employeeId', 'firstName lastName email department')
      .sort({ expiryDate: 1 });

    res.json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};
