const express = require('express');
const router = express.Router();
const controller = require('../controllers/communityController');
const { requireAnonymous, optionalAnonymous } = require('../middleware/anonymousAuth');

router.get('/posts', optionalAnonymous, controller.listPosts);
router.get('/posts/:postId', optionalAnonymous, controller.getPost);
router.get('/posts/:postId/comments', controller.listComments);
router.get('/rankings', controller.ratingRankings);
router.use(requireAnonymous);
router.post('/posts', controller.createPost);
router.delete('/posts/:postId', controller.deletePost);
router.post('/posts/:postId/comments', controller.createComment);
router.post('/posts/:postId/:kind', controller.toggleReaction);
router.delete('/comments/:commentId', controller.deleteComment);
router.post('/dishes/:dishId/rating', controller.saveRating);
router.get('/favorites', controller.listFavorites);

module.exports = router;
