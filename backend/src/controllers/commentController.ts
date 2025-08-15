import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

class CommentController {
  // Get comments for an NFT
  async getNFTComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { nftId } = req.params
      const { page = 1, limit = 20, parentId } = req.query

      // Check if NFT exists
      const nft = await prisma.nFT.findUnique({
        where: { id: nftId }
      })

      if (!nft) {
        throw new NotFoundError('NFT not found')
      }

      const offset = (Number(page) - 1) * Number(limit)

      // Build where clause
      const whereClause: any = {
        nftId,
        // Only get top-level comments if parentId not specified
        parentId: parentId ? String(parentId) : null
      }

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: whereClause,
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                address: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    address: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                    isVerified: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' },
              take: 5 // Limit initial replies shown
            },
            _count: {
              select: {
                replies: true
              }
            }
          }
        }),
        prisma.comment.count({ where: whereClause })
      ])

      res.json({
        comments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Create a new comment
  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { nftId } = req.params
      const { content, parentId } = req.body
      const currentUser = req.user

      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }

      if (!content || content.trim().length === 0) {
        throw new ValidationError('Comment content is required')
      }

      if (content.length > 1000) {
        throw new ValidationError('Comment must be less than 1000 characters')
      }

      // Check if NFT exists
      const nft = await prisma.nFT.findUnique({
        where: { id: nftId }
      })

      if (!nft) {
        throw new NotFoundError('NFT not found')
      }

      // If replying to a comment, check if parent exists
      if (parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId }
        })

        if (!parentComment) {
          throw new NotFoundError('Parent comment not found')
        }

        if (parentComment.nftId !== nftId) {
          throw new ValidationError('Parent comment does not belong to this NFT')
        }
      }

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          content: content.trim(),
          nftId,
          userId: currentUser.id,
          parentId: parentId || null
        },
        include: {
          user: {
            select: {
              id: true,
              address: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true
            }
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  address: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isVerified: true
                }
              }
            }
          },
          _count: {
            select: {
              replies: true
            }
          }
        }
      })

      // Create notification for NFT owner (if not commenting on own NFT)
      if (nft.ownerId !== currentUser.id) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { displayName: true, username: true }
          })
          
          await prisma.notification.create({
            data: {
              userId: nft.ownerId,
              type: 'COMMENT',
              title: 'New Comment',
              message: `${user?.displayName || user?.username || 'Someone'} commented on your NFT "${nft.name}"`,
              data: {
                nftId: nft.id,
                commentId: comment.id,
                commenterAddress: currentUser.address
              }
            }
          })
        } catch (notificationError) {
          logger.warn('Failed to create comment notification:', notificationError)
        }
      }

      res.status(201).json({
        message: 'Comment created successfully',
        comment
      })

    } catch (error) {
      next(error)
    }
  }

  // Update a comment
  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params
      const { content } = req.body
      const currentUser = req.user

      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }

      if (!content || content.trim().length === 0) {
        throw new ValidationError('Comment content is required')
      }

      if (content.length > 1000) {
        throw new ValidationError('Comment must be less than 1000 characters')
      }

      // Find comment
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: {
              id: true,
              address: true
            }
          }
        }
      })

      if (!comment) {
        throw new NotFoundError('Comment not found')
      }

      // Check if user owns this comment
      if (comment.userId !== currentUser.id) {
        throw new ForbiddenError('You can only edit your own comments')
      }

      // Update comment
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: content.trim(),
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              address: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true
            }
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  address: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isVerified: true
                }
              }
            }
          },
          _count: {
            select: {
              replies: true
            }
          }
        }
      })

      res.json({
        message: 'Comment updated successfully',
        comment: updatedComment
      })

    } catch (error) {
      next(error)
    }
  }

  // Delete a comment
  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params
      const currentUser = req.user

      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }

      // Find comment
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: {
              id: true,
              address: true
            }
          },
          nft: {
            select: {
              ownerId: true
            }
          }
        }
      })

      if (!comment) {
        throw new NotFoundError('Comment not found')
      }

      // Check if user owns this comment or owns the NFT
      const canDelete = comment.userId === currentUser.id || comment.nft.ownerId === currentUser.id

      if (!canDelete) {
        throw new ForbiddenError('You can only delete your own comments or comments on your NFTs')
      }

      // Delete comment and all its replies (cascading delete)
      await prisma.comment.deleteMany({
        where: {
          OR: [
            { id: commentId },
            { parentId: commentId }
          ]
        }
      })

      res.json({
        message: 'Comment deleted successfully'
      })

    } catch (error) {
      next(error)
    }
  }

  // Get replies for a comment
  async getCommentReplies(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params
      const { page = 1, limit = 10 } = req.query

      // Check if parent comment exists
      const parentComment = await prisma.comment.findUnique({
        where: { id: commentId }
      })

      if (!parentComment) {
        throw new NotFoundError('Comment not found')
      }

      const offset = (Number(page) - 1) * Number(limit)

      const [replies, total] = await Promise.all([
        prisma.comment.findMany({
          where: { parentId: commentId },
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                address: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            }
          }
        }),
        prisma.comment.count({ where: { parentId: commentId } })
      ])

      res.json({
        replies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })

    } catch (error) {
      next(error)
    }
  }
}

export const commentController = new CommentController()