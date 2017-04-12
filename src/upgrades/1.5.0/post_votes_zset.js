/* jslint node: true */

'use strict';

var db = require('../../database');

var async = require('async');

module.exports = {
	name: 'New sorted set posts:votes',
	timestamp: Date.UTC(2017, 1, 27),
	method: function (callback) {
		var progress = this.progress;

		db.sortedSetCard('posts:pid', function (err, numPosts) {
			if (err) {
				return callback(err);
			}

			progress.total = numPosts;

			require('../../batch').processSortedSet('posts:pid', function (pids, next) {
				async.eachSeries(pids, function (pid, next) {
					db.getObjectFields('post:' + pid, ['upvotes', 'downvotes'], function (err, postData) {
						if (err || !postData) {
							return next(err);
						}

						var votes = parseInt(postData.upvotes || 0, 10) - parseInt(postData.downvotes || 0, 10);
						progress.incr();
						db.sortedSetAdd('posts:votes', votes, pid, next);
					});
				}, next);
			}, {}, callback);
		});
	},
};
