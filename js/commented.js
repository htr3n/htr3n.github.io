(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var Commented = require('./lib');
function defaultSlug() {
  return (window.location.host + window.location.pathname);
}
document.addEventListener('DOMContentLoaded', function() {
  var node = document.getElementById('commented-main');
  if (!node) {
    console.error('#commented-main node not found');
    return;
  }
  var options = {
    firebase: node.getAttribute('data-firebase'),
    type: 'firebase',
    auth: node.getAttribute('data-auth').split(' '),
    slug: node.getAttribute('data-slug') || defaultSlug(),
    inline: node.getAttribute('data-inline'),
    main: node
  };
  if (!options.firebase) {
    console.error('Invalid configuration! data-firebase must be specified');
    return;
  }
  Commented(options);
});

//# sourceURL=/Users/huytran/working/dev/dev-web/github-repos/commented/index.js
},{"./lib":11}],2:[function(require,module,exports){
/** @jsx React.DOM */
var Login = require('./login.jsx')
  , CreateComment = require('./create-comment.jsx')
  , NoJank = require('./no-jank.js')

var AddComment = React.createClass({displayName: 'AddComment',
  // mixins: [SlideDown],
  slide: {
    duration: 3
  },
  propTypes: {
    user: React.PropTypes.object,
    autoAdd: React.PropTypes.bool,
    noCancel: React.PropTypes.bool,
  },
  getInitialState: function () {
    return {
      adding: false
    }
  },
  onShow: function () {
    this.setState({adding: true});
  },
  onHide: function () {
    this.setState({adding: false});
  },
  render: function () {
    if (!this.state.adding && !this.props.autoAdd) {
      return React.DOM.div({className: "add-comment", onClick: this.onShow}, 
        "Add a comment"
      )
    }
    if (!this.props.user) {
      return Login({db: this.props.db, auth: this.props.auth, onCancel: !this.props.noCancel && this.onHide})
    }
    return CreateComment({
      onHide: !this.props.noCancel && this.onHide, 
      target: this.props.target, 
      db: this.props.db, 
      user: this.props.user})
  }
});

module.exports = AddComment

},{"./create-comment.jsx":7,"./login.jsx":13,"./no-jank.js":16}],3:[function(require,module,exports){
/** @jsx React.DOM */
var AutoTextarea = React.createClass({displayName: 'AutoTextarea',
  componentDidMount: function () {
    var node = this.getDOMNode()
    node.style.height = 'auto'
    node.style.height = node.scrollHeight + 'px'
    node.style.scrollTop = node.scrollHeight
    node.focus()
    node.selectionStart = node.selectionEnd = node.value.length
  },

  render: function () {
    var style
      , node

    if (this.isMounted()) {
      node = this.getDOMNode()
      node.style.height = 'auto'
      node.style.height = node.scrollHeight + 'px'
      style = {
        height: node.scrollHeight + 'px',
        scrollTop: node.scrollHeight
      }
    }
    return this.transferPropsTo(
      React.DOM.textarea({style: style, className: "auto-textarea"})
    )
  }
});

module.exports = AutoTextarea

},{}],4:[function(require,module,exports){
"use strict";
module.exports = cleanSlug;
function cleanSlug(slug) {
  return slug.replace(/[^a-zA-Z0-9]/gm, '-');
}

//# sourceURL=/Users/huytran/working/dev/dev-web/github-repos/commented/lib/clean-slug.js
},{}],5:[function(require,module,exports){
/** @jsx React.DOM */
var format = require('./format')
  , AutoTextarea = require('./auto-textarea.jsx')
  , ReplyLogin = require('./reply-login.jsx')
  , cx = React.addons.classSet
  , SlideDown = require('./slide-down.js')
  , PT = React.PropTypes

var CommentDisplay = React.createClass({displayName: 'CommentDisplay',
  mixins: [SlideDown],
  getSlide: function () {
    return {
      duration: .3,
      closeHeight: this.props.creating && !this.props.isReply ? 30 : 0
    }
  },
  propTypes: {
    editing: React.PropTypes.bool.isRequired,
    canEdit: React.PropTypes.bool,
    data: React.PropTypes.object.isRequired,
    creating: React.PropTypes.bool,
    isReply: React.PropTypes.bool,

    onEdit: React.PropTypes.func,
    doneEditing: React.PropTypes.func,
    onRemove: React.PropTypes.oneOfType([
      PT.bool, PT.func
    ]),
    onLogout: React.PropTypes.func,

    onReply: PT.oneOfType([
      PT.bool, PT.func
    ]),
    onHeart: React.PropTypes.func,
    onUnHeart: React.PropTypes.func,
    onFlag: React.PropTypes.func,
  },

  getInitialState: function () {
    return {
      text: this.props.data.text,
    }
  },

  onLogout: function () {
    this.slideAway(this.props.onLogout)
  },

  onRemove: function () {
    this.slideAway(this.props.onRemove)
  },

  cancelEdit: function () {
    this.setState({text: this.props.data.text})
    if (this.props.creating) {
      this.slideAway(this.props.cancelEdit)
    } else {
      this.props.cancelEdit();
    }
  },

  doneEditing: function () {
    if (!this.state.text) return
    if (this.props.creating) {
      this.slideAway(this.props.doneEditing.bind(null, this.state.text))
    } else {
      this.props.doneEditing(this.state.text)
    }
  },

  onChange: function (e) {
    this.setState({text: e.target.value});
  },

  getVotes: function () {
    var votes = {
      heart: false,
      heartCount: 0,
      flagged: this.props.data.flags && this.props.data.flags[this.props.userid],
      flagCount: 0
    }

    if (this.props.data.votes && this.props.data.votes[this.props.userid]) {
      votes.heart = true
    }
    for (var id in this.props.data.votes) {
      votes.heartCount += 1
    }
    for (var id in this.props.data.flags) {
      if (this.props.data.flags[id]) {
        votes.flagCount += 1
      }
    }
    return votes
  },

  voteButtons: function (votes) {
    if (!this.props.canVote) return

    return React.DOM.div({className: "commented_buttons"}, 
      React.DOM.span({
        onClick: this.props.onFlag.bind(null, !votes.flagged), 
        className: cx({
          "button commented_flag": true,
          "commented_flag--active": votes.flagged
        })}, 
        React.DOM.i({className: "fa fa-flag"})
      ), 
      React.DOM.span({
        onClick: votes.heart ? this.props.onUnHeart : this.props.onHeart, 
        className: cx({
          "button commented_heart": true,
          "commented_heart--shown shown": !!votes.heartCount,
          "commented_heart--active active": votes.heart
        })}, 
        React.DOM.span({className: "count"}, votes.heartCount), 
        React.DOM.i({className: "fa fa-heart"})
      ), 
      !this.props.isReply && React.DOM.span({onClick: this.props.onReply, className: "commented_reply"}, "reply")
    );
  },

  editButtons: function () {
    return React.DOM.div({className: "commented_buttons"}, 
      React.DOM.span({onClick: this.doneEditing, className: "commented_done-edit button"}, 
        this.props.creating ? 'post' : 'save'
      ), 
      this.props.cancelEdit &&
        React.DOM.span({onClick: this.cancelEdit, className: "commented_remove button"}, 
            "cancel"
        )
    )
  },

  replyLogin: function () {
    if (this.props.isReply) return false
    return React.DOM.div({className: "commented_buttons"}, 
      ReplyLogin({
        db: this.props.db, 
        auth: this.props.db.options.auth, 
        onCancel: this.props.cancelReply, 
        onReply: this.props.onReply})
    )
  },

  buttons: function (votes) {
    if (!this.props.userid) {
      return this.replyLogin()
    }
    if (!this.props.canEdit) {
      return this.voteButtons(votes)
    }
    if (this.props.editing) {
      return this.editButtons()
    }
    return React.DOM.div({className: "commented_buttons"}, 
      React.DOM.span({onClick: this.props.onEdit, className: "commented_edit button"}, 
        React.DOM.i({className: "fa fa-pencil"})
      ), 
      React.DOM.span({onClick: this.onRemove, className: "commented_remove button"}, 
        React.DOM.i({className: "fa fa-times"})
      ), 
      !this.props.isReply && React.DOM.span({onClick: this.props.onReply, className: "commented_reply"}, "reply")
    );
  },

  body: function () {
    if (!this.props.editing) {
      return format(this.props.data.text, "text")
    }
    return AutoTextarea({
      placeholder: "Type your comment here", 
      onChange: this.onChange, 
      value: this.state.text})
  },

  render: function () {
    var comment = this.props.data
      , cls = "commented_comment"
    if (this.props.editing) {
      cls += ' commented_comment--editing'
    }
    if (this.props.canEdit) {
      cls += ' commented_comment--mine'
    }
    if (this.props.isReply) {
      cls += ' commented_comment--reply'
    }
    if (this.props.hasReplies) {
      cls += ' commented_comment--has-replies'
    }

    var votes = this.getVotes()
    if (votes.flagCount > 2 && this.props.userid !== this.props.data.userid) {
      return React.DOM.div({className: cls + " commented_comment--flagged"}, 
        React.DOM.span({className: "commented_pic fa-stack fa-lg"}, 
          React.DOM.i({className: "fa fa-circle fa-stack-2x"}), 
          React.DOM.i({className: "fa fa-flag fa-stack-1x fa-inverse"})
        ), 
        React.DOM.span({className: "display-name"}, 
          "flagged comment hidden"
        )
      )
    }

    return React.DOM.div({className: cls}, 
      React.DOM.img({className: "commented_pic", src: comment.picture}), 
      React.DOM.div({className: "right"}, 
        this.buttons(votes), 
        React.DOM.strong({className: "display-name"}, comment.displayName), 
        comment.created && // TODO have this time auto-update
          React.DOM.span({className: "display-time"}, moment(comment.created).fromNow()), 
        this.props.parentDeleted &&
          React.DOM.span({className: "parent-deleted"}, "in reply to a deleted comment"), 
        this.props.creating &&
          React.DOM.button({className: "commented_logout", onClick: this.onLogout}, "logout"), 
        this.body()
      )
    );
  }
});

module.exports = CommentDisplay

},{"./auto-textarea.jsx":3,"./format":10,"./reply-login.jsx":17,"./slide-down.js":19}],6:[function(require,module,exports){
/** @jsx React.DOM */
var CommentDisplay = require('./comment-display.jsx')

var Comment = React.createClass({displayName: 'Comment',
  propTypes: {
    data: React.PropTypes.object.isRequired,
    canEdit: React.PropTypes.bool,
    userid: React.PropTypes.string,
    db: React.PropTypes.object,
  },

  getInitialState: function () {
    return {
      editing: false,
      replying: false,
    }
  },

  onRemove: function () {
    this.props.db.removeComment(this.props.data._id)
  },

  onEdit: function (e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.setState({editing: true})
  },

  onReply: function () {
    if (this.props.isReply) return
    this.setState({editing: false, replying: true});
  },

  onUnHeart: function () {
    this.props.db.unHeart(this.props.data._id, this.props.userid)
  },

  onHeart: function () {
    this.props.db.heart(this.props.data._id, this.props.userid)
  },

  onFlag: function (flag) {
    this.props.db.flag(this.props.data._id, this.props.userid, flag)
  },

  cancelEdit: function () {
    this.setState({editing: false})
  },

  doneEditing: function (text) {
    if (!this.state.editing) return
    if (!text) return
    this.props.db.editComment(this.props.data._id, text)
    this.setState({editing: false})
  },

  doneReplying: function (text) {
    if (!this.state.replying) return
    if (!text) return
    this.props.db.addComment(text, "reply:" + this.props.data._id, '')
    this.setState({replying: false})
  },

  cancelReply: function () {
    this.setState({replying: false})
  },

  renderReplies: function () {
    var replies = this.props.replies
    if (!replies.length && !this.state.replying) {
      return false
    }
    var user = this.props.user
    return React.DOM.div({className: "commented_replies"}, 

      replies.map(function (comment) {
        return Comment({
          key: comment._id,
          isReply: true,
          replies: [],
          canEdit: user && user.uid == comment.userid,
          canVote: !!user,
          userid: user && user.uid,
          data: comment,
          user: user,
          db: this.props.db,
        })
      }.bind(this)), 

      this.state.replying && user && CommentDisplay({
        editing: true,
        canEdit: true,
        canVote: false,
        data: {
          picture: this.props.user.picture,
          displayName: this.props.user.displayName,
          text: ''
        },
        onLogout: this.onLogout,
        userid: this.props.userid,
        isReply: true,
        creating: true,

        cancelEdit: this.cancelReply,
        doneEditing: this.doneReplying,
        onRemove: this.cancelReply
      })
    )
  },

  onLogout: function () {
    this.setState({replying: false, editing: false})
    this.props.db.logout()
  },

  render: function () {
    return React.DOM.div({className: "commented_one"}, 
      CommentDisplay({
        editing: this.state.editing,
        canEdit: this.props.canEdit,
        canVote: this.props.canVote,
        data: this.props.data,
        db: this.props.db,
        isReply: this.props.isReply,
        hasReplies: (this.props.userid &&
                     this.state.replying) ||
                     this.props.replies &&
                     this.props.replies.length,
        userid: this.props.userid,
        parentDeleted: this.props.parentDeleted,

        onEdit: this.onEdit,
        onFlag: this.onFlag,
        onReply: !this.props.isReply && this.onReply,
        cancelReply: this.cancelReply,
        onLogout: this.onLogout,
        onRemove: this.onRemove,
        onHeart: this.onHeart,
        onUnHeart: this.onUnHeart,
        doneEditing: this.doneEditing,
        cancelEdit: this.cancelEdit,
      }), 
      this.renderReplies()
    )
  }
});

module.exports = Comment;

},{"./comment-display.jsx":5}],7:[function(require,module,exports){
/** @jsx React.DOM */
var CommentDisplay = require('./comment-display.jsx')
var PT = React.PropTypes

var CreateComment = React.createClass({displayName: 'CreateComment',
  propTypes: {
    onHide: React.PropTypes.oneOfType([
        PT.bool, PT.func
    ]),
    target: React.PropTypes.string.isRequired,
    db: React.PropTypes.object.isRequired,
    user: React.PropTypes.object.isRequired
  },
  getInitialState: function () {
    return {
      text: ''
    }
  },

  _onSubmit: function (text) {
    if (!text) return
    this.props.db.addComment(text, this.props.target, false)
    this.props.onHide && this.props.onHide()
  },

  render: function () {
    return CommentDisplay({
      canEdit: true,
      editing: true,
      creating: true,
      data: {
        picture: this.props.user.picture,
        displayName: this.props.user.displayName,
        text: '',
      },
      userid: this.props.user.uid,

      onLogout: this.props.db.logout.bind(this.props.db),
      cancelEdit: this.props.onHide,
      doneEditing: this._onSubmit,
      onRemove: this.props.onHide
    })
  }
});

module.exports = CreateComment


},{"./comment-display.jsx":5}],8:[function(require,module,exports){
"use strict";
module.exports = DBFirebase;
function DBFirebase(options) {
  this.db = new Firebase('https://' + options.firebase + '.firebaseio.com/comments/' + options.slug);
  var onValue;
  this.db.on('value', onValue = function() {
    this.db.off('value', onValue);
    this.loaded = true;
  }.bind(this));
  this.user = null;
  this.options = options;
  this._auth = new FirebaseSimpleLogin(this.db, this._onLogin.bind(this));
  this.liHanders = [];
}
DBFirebase.prototype = {
  addComment: function(text, target, quote) {
    if (!this.user) {
      return console.error("Not logged in");
    }
    this.db.push({
      created: Date.now(),
      displayName: this.user.displayName,
      picture: this.user.picture,
      userid: this.user.uid,
      text: text,
      target: target,
      quote: quote
    });
  },
  editComment: function(id, text) {
    if (!this.user) {
      return console.error("Not logged in");
    }
    this.db.child(id).update({text: text});
  },
  removeComment: function(id) {
    if (!this.user) {
      return console.error("Not logged in");
    }
    this.db.child(id).remove();
  },
  flag: function(id, uid, flag) {
    if (flag) {
      this.db.child(id).child('flags').child(uid).set(flag);
    } else {
      this.db.child(id).child('flags').child(uid).remove();
    }
  },
  heart: function(id, uid) {
    this.db.child(id).child('votes').child(uid).set(true);
  },
  unHeart: function(id, uid) {
    this.db.child(id).child('votes').child(uid).remove();
  },
  login: function(type) {
    this._auth.login(type, {rememberMe: true});
  },
  _onLogin: function(err, user) {
    if (err || !user) {
      return this.fireLoggedin(null);
    }
    user.picture = (user.thirdPartyUserData.profile_image_url || user.thirdPartyUserData.picture || user.thirdPartyUserData.avatar_url);
    if (user.picture && user.picture.data) {
      user.picture = user.picture.data.url;
    }
    this.user = user;
    this.fireLoggedin(user);
  },
  fireLoggedin: function(user) {
    this.liHanders.forEach(function(fn) {
      fn(user);
    });
  },
  logout: function() {
    this._auth.logout();
  },
  onLogin: function(cb) {
    this.liHanders.push(cb);
  },
  offLogin: function(cb) {
    var i = this.liHanders.indexOf(cb);
    if (i === -1)
      return;
    this.liHanders.splice(i, 1);
  },
  onceLoaded: function(done) {
    var onValue;
    this.db.on('value', onValue = function() {
      done();
      this.db.off('value', onValue);
    }.bind(this));
  },
  onAdd: function(cb) {
    this.db.on('child_added', function(snapshot) {
      var val = snapshot.val();
      val._id = snapshot.name();
      cb(val);
    });
  },
  onChange: function(cb) {
    this.db.on('child_changed', function(snapshot) {
      var val = snapshot.val();
      val._id = snapshot.name();
      cb(val);
    });
  },
  onRemove: function(cb) {
    this.db.on('child_removed', function(snapshot) {
      cb(snapshot.name());
    });
  }
};

//# sourceURL=/Users/huytran/working/dev/dev-web/github-repos/commented/lib/db-firebase.js
},{}],9:[function(require,module,exports){
"use strict";
var DBFirebase = require('./db-firebase');
module.exports = function(options) {
  switch (options.type) {
    case "firebase":
      return new DBFirebase(options);
    default:
      console.error("Invalid backend specified", options.type, options);
  }
};

//# sourceURL=/Users/huytran/working/dev/dev-web/github-repos/commented/lib/db.js
},{"./db-firebase":8}],10:[function(require,module,exports){
"use strict";
if (window.marked) {
  marked.setOptions({
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: true
  });
  module.exports = function(text, cls) {
    return React.DOM.div({
      className: cls,
      dangerouslySetInnerHTML: {__html: marked(text)}
    });
  };
} else {
  module.exports = function(x, cls) {
    return React.DOM.div({className: cls}, x);
  };
}

//# sourceURL=/Users/huytran/working/dev/dev-web/github-repos/commented/lib/format.js
},{}],11:[function(require,module,exports){
"use strict";
var cleanSlug = require('./clean-slug.js'),
    getDb = require('./db'),
    InlineComments = require('./inline-comments.jsx'),
    MainComments = require('./main-comments.jsx');
module.exports = function(options) {
  options.slug = cleanSlug(options.slug);
  var db = window.db = getDb(options);
  if (!db)
    return console.error('Failed to initialize db');
  if (options.inline) {
    var body = document.querySelector(options.inline);
    body.classList.add('commented_inline-body');
    var nodes = body.querySelectorAll(options.inline + ' > *');
    ;
    [].forEach.call(nodes, (function(node, i) {
      var id = node.getAttribute('data-section-id') || i;
      var inline = document.createElement('div');
      inline.className = 'commented_inline-wrapper';
      node.classList.add('commented_section');
      node.appendChild(inline);
      React.renderComponent(InlineComments({
        target: 'inline:' + id,
        body: body,
        auth: options.auth,
        db: db
      }), inline);
    }));
  }
  React.renderComponent(MainComments({
    auth: options.auth,
    db: db
  }), options.main);
};

//# sourceURL=/Users/huytran/working/dev/dev-web/github-repos/commented/lib/index.js
},{"./clean-slug.js":4,"./db":9,"./inline-comments.jsx":12,"./main-comments.jsx":14}],12:[function(require,module,exports){
/** @jsx React.DOM */
var PT = React.PropTypes
  , mixing = require('./mixin')
  , ViewComments = require('./view-comments.jsx')
  , cx = React.addons.classSet

function isDescendent(child, parent) {
  while (child) {
    if (child === parent) return true
    child = child.parentNode
  }
  return false;
}

var InlineComments = React.createClass({displayName: 'InlineComments',
  mixins: [mixing],
  propTypes: {
    target: PT.string.isRequired,
    body: PT.object.isRequired,
    auth: PT.array.isRequired,
    db: PT.object.isRequired,
  },

  componentDidMount: function () {
    document.addEventListener('click', this.docMouseDown);
  },

  componentWillUnmount: function () {
    document.removeEventListener('click', this.docMouseDown);
  },

  docMouseDown: function (e) {
    if (!this.state.showing) {
      return
    }
    var isComment = false
      , node = e.target
      , me = this.getDOMNode()
    if (node.classList.contains('add-comment')) {
      return
    }
    while (node) {
      if (node === me) return
      if (node.classList) {
        if (node.classList.contains('commented_login-type')) {
          return
        }
        if (node.classList.contains('commented_inline')) {
          isComment = true
          break;
        }
      }
      if (!node.parentNode && node !== document) {
        // node disappeared
        return;
      }
      node = node.parentNode
    }
    if (!isComment) {
      this.props.body.classList.remove('commented_inline-body--shifted')
    }
    this.setState({showing: false})
  },

  componentDidUpdate: function () {
    if (this.state.showing) {
      this.props.body.classList.add('commented_inline-body--shifted')
    }
  },

  onShow: function () {
    if (this.state.showing) {
      return this.onHide()
    }
    this.setState({showing: true});
  },

  onHide: function () {
    this.props.body.classList.remove('commented_inline-body--shifted')
    this.setState({showing: false});
  },

  render: function () {
    var comments = this.organizeComments();
    var hasComments = comments && comments.list.length
    var count = 0;
    comments ? comments.list.forEach(function (item) {
      count += 1 + item.replies.length
    }) : null;
    return React.DOM.div({className: cx({
      "commented_inline": true,
      'commented_inline--empty': !hasComments,
      'commented_inline--showing': this.state.showing
    })}, 
      React.DOM.div({className: "commented_inline_flag", onClick: this.onShow}, 
        count || '+'
      ), 
      this.state.showing && ViewComments({
        comments: comments,
        db: this.props.db,
        user: this.state.user,
        loading: this.state.loading,
        auth: this.props.auth,
        target: this.props.target,
        startAdding: !hasComments,
      })
    );
  }

});

module.exports = InlineComments;

},{"./mixin":15,"./view-comments.jsx":20}],13:[function(require,module,exports){
/** @jsx React.DOM */
var ICONS = {
  facebook: 'facebook',
  twitter: 'twitter',
  google: 'google',
  github: 'github'
}

var Login = React.createClass({displayName: 'Login',
  propTypes: {
    db: React.PropTypes.object.isRequired,
    auth: React.PropTypes.array.isRequired,
    onLogin: React.PropTypes.func.isRequired,
    onCancel: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return {
      loading: false
    }
  },

  componentDidMount: function () {
    this.props.db.onLogin(this._onLogin)
  },
  componentWillUnmount: function () {
    this.props.db.offLogin(this._onLogin)
  },

  _onLogin: function () {
    this.setState({loading: false})
  },

  onClick: function (type) {
    this.setState({loading: type})
    this.props.db.login(type)
  },

  render: function () {
    if (this.state.loading) {
      return React.DOM.div({className: "commented_login--loading commented_login"}, 
        "Connecting to ", this.state.loading, 
        React.DOM.i({className: "fa fa-spin fa-spinner"})
      )
    }

    return React.DOM.div({className: "commented_login"}, 
      this.props.auth.map(function (type) {
        var icon = ICONS[type]
          , cls = "commented_login-type"
        cls += ' commented_login-type--' + type
        return React.DOM.button({key: type, className: cls, onClick: this.onClick.bind(this, type)}, 
          React.DOM.span({className: "commented_pic fa-stack fa-lg"}, 
            React.DOM.i({className: "fa fa-circle fa-stack-2x"}), 
            React.DOM.i({className: "fa fa-" + icon + " fa-stack-1x fa-inverse"})
          )
        );
      }.bind(this)), 
      this.props.onCancel && React.DOM.button({className: "commented_login-type commente_login-type--cancel", 
          onClick: this.props.onCancel}, "×"
        )
    );
  }
});

module.exports = Login

},{}],14:[function(require,module,exports){
/** @jsx React.DOM */
var ViewComments = require('./view-comments.jsx')
  , mixing = require('./mixin')

var MainComments = React.createClass({displayName: 'MainComments',
  mixins: [mixing],
  propTypes: {
    db: React.PropTypes.object.isRequired,
    auth: React.PropTypes.array.isRequired
  },

  getDefaultProps: function () {
    return {
      target: 'main'
    }
  },

  render: function () {
    return ViewComments({
      comments: this.organizeComments(),
      loading: this.state.loading,
      user: this.state.user,
      db: this.props.db,
      auth: this.props.auth,
      target: 'main'
    });
  },
});

module.exports = MainComments;

},{"./mixin":15,"./view-comments.jsx":20}],15:[function(require,module,exports){
"use strict";
var up = React.addons.update;
module.exports = {
  propTypes: {
    db: React.PropTypes.object.isRequired,
    auth: React.PropTypes.array.isRequired
  },
  getInitialState: function() {
    return {
      comments: {},
      loading: !this.props.db.loaded,
      user: null
    };
  },
  _onLogin: function(user) {
    this.setState({user: user});
  },
  _onLoaded: function() {
    this.setState({loading: false});
  },
  componentWillUnmount: function() {
    this.props.db.offLogin(this._onLogin);
  },
  componentDidMount: function() {
    this.props.db.onLogin(this._onLogin);
    if (!this.props.db.loaded) {
      this.props.db.onceLoaded(this._onLoaded);
    }
    this.props.db.onAdd(this._onAdded);
    this.props.db.onRemove(this._onRemoved);
    this.props.db.onChange(this._onChanged);
    this.setState({user: this.props.db.user});
  },
  organizeComments: function() {
    var $__0 = this;
    var ids = Object.keys(this.state.comments),
        comments = this.state.comments,
        showAll = this.state.showAll,
        isMain = this.props.target === 'main',
        numInlines = 0,
        replies = [],
        map = {},
        list = [];
    if (!ids.length)
      return null;
    ids.forEach((function(id) {
      if (!comments[id])
        return;
      var item = {
        comment: comments[id],
        replies: []
      };
      var target = comments[id].target;
      map[id] = item;
      if (target === $__0.props.target) {
        list.push(item);
      } else if (isMain && target.indexOf('inline:') === 0) {
        numInlines += 1;
        if (showAll) {
          list.push(item);
        }
      } else if (target.indexOf('reply:') === 0) {
        replies.push(comments[id]);
      }
    }));
    replies.forEach(function(comment) {
      var parent = comment.target.slice('reply:'.length);
      if (!map[parent]) {
        if (isMain) {
          list.push({
            comment: comment,
            parentDeleted: true,
            replies: []
          });
        }
        return;
      }
      map[parent].replies.push(comment);
    });
    return {
      list: list,
      numInlines: numInlines
    };
  },
  _onAdded: function(comment) {
    var update = {};
    update[comment._id] = {$set: comment};
    this.setState({comments: up(this.state.comments, update)});
  },
  _onChanged: function(comment) {
    var update = {};
    update[comment._id] = {$set: comment};
    this.setState({comments: up(this.state.comments, update)});
  },
  _onRemoved: function(id) {
    var update = {};
    update[id] = {$set: null};
    this.setState({comments: up(this.state.comments, update)});
  }
};

//# sourceURL=/Users/huytran/working/dev/dev-web/github-repos/commented/lib/mixin.js
},{}],16:[function(require,module,exports){
"use strict";
module.exports = {
  componentDidMount: function() {
    var node = this.getDOMNode();
    this._height = node.getBoundingClientRect().height;
  },
  componentDidUpdate: function() {
    var lastHeight = this._height,
        node = this.getDOMNode(),
        dur = this.slide.duration + '';
    node.style.WebkitTransition = '';
    node.style.height = 'auto';
    var newHeight = this._height = node.getBoundingClientRect().height;
    node.style.height = lastHeight + 'px';
    setTimeout(function() {
      node.style.WebkitTransition = 'height ' + dur + 's ease';
      node.style.height = newHeight;
    }, 0);
  }
};

//# sourceURL=/Users/huytran/working/dev/dev-web/github-repos/commented/lib/no-jank.js
},{}],17:[function(require,module,exports){
/** @jsx React.DOM */
var Login = require('./login.jsx')

var ReplyLogin = React.createClass({displayName: 'ReplyLogin',
  propTypes: {
    db: React.PropTypes.object.isRequired,
    auth: React.PropTypes.array.isRequired,
    onCancel: React.PropTypes.func,
    onReply: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      open: false
    }
  },
  onOpen: function () {
    this.props.onReply()
    this.setState({open: true})
  },
  onCancel: function () {
    this.props.onCancel()
    this.setState({open: false})
  },
  render: function () {
    return React.DOM.span({className: "commented_reply-login"}, 
      this.state.open ?
        Login({
          db: this.props.db, 
          auth: this.props.auth, 
          onLogin: this.props.onReply, 
          onCancel: this.onCancel}
        ) :
        React.DOM.span({onClick: this.onOpen, className: "commented_reply"}, "reply")
      
    )
  },
})

module.exports = ReplyLogin

},{"./login.jsx":13}],18:[function(require,module,exports){
/** @jsx React.DOM */
var ShowAller = React.createClass({displayName: 'ShowAller',
  propTypes: {
    skipped: React.PropTypes.number
  },
  render: function () {
    var show = this.props.showAll
    return React.DOM.div({className: "commented_show-aller"}, 
      React.DOM.button({
          className: "commented_show-aller_btn", 
          onClick: this.props.onChange.bind(null, !show)}, 
        show ? 'Hide' : 'Show', " ", this.props.count, " side comments"
      )
    );
  }
});

module.exports = ShowAller


},{}],19:[function(require,module,exports){
"use strict";
module.exports = {
  componentDidMount: function() {
    var node = this.getDOMNode(),
        style = window.getComputedStyle(node),
        height = parseFloat(style.height),
        paddingBottom = style.paddingBottom;
    this.slide = this.getSlide();
    node.style.height = this.slide.closeHeight || 0;
    node.style.opacity = 0;
    node.style.overflow = 'hidden';
    node.style.paddingBottom = 0;
    var style = window.getComputedStyle(node);
    var dur = this.slide.duration;
    setTimeout(function() {
      node.style.transition = 'height ' + dur + 's ease, opacity ' + dur + 's ease, padding-bottom ' + dur + 's ease';
      node.style.height = height + 'px';
      node.style.paddingBottom = paddingBottom;
      node.style.opacity = 1;
    }, 0);
    function fin() {
      node.removeEventListener('transitionend', fin);
      node.style.height = 'auto';
    }
    node.addEventListener('transitionend', fin);
  },
  slideAway: function(done) {
    var node = this.getDOMNode();
    var style = window.getComputedStyle(node);
    node.style.height = style.height;
    var box = node.getBoundingClientRect();
    node.style.height = (this.slide.closeHeight || 0) + 'px';
    node.style.opacity = 0;
    node.style.paddingBottom = 0;
    function fin() {
      node.removeEventListener('transitionend', fin);
      done && done();
    }
    node.addEventListener('transitionend', fin);
  }
};

//# sourceURL=/Users/huytran/working/dev/dev-web/github-repos/commented/lib/slide-down.js
},{}],20:[function(require,module,exports){
/** @jsx React.DOM */
var mixing = require('./mixin')
  , Comment = require('./comment.jsx')
  , ShowAller = require('./show-aller.jsx')
  , AddComment = require('./add-comment.jsx')

var ViewComments = React.createClass({displayName: 'ViewComments',
  propTypes: {
    comments: React.PropTypes.object,
    db: React.PropTypes.object.isRequired,
    auth: React.PropTypes.array.isRequired,
    target: React.PropTypes.string.isRequired,
    startAdding: React.PropTypes.bool,
  },

  getInitialState: function () {
    return {
      showAll: false,
    }
  },

  _onChangeShow: function (which) {
    this.setState({
      showAll: which
    })
  },

  renderComments: function () {
    if (!this.props.comments) {
      if (this.props.loading) {
        return React.DOM.span(null, 
            React.DOM.i({className: "fa fa-spin fa-spinner"}), 
            ' ', "Loading..."
        )
      }
      return null
    }

    var organized = this.props.comments
    var user = this.props.user
    var db = this.props.db
    var isMain = this.props.target === 'main'

    var comments = organized.list.map(function (item) {
      return Comment({
        key: item.comment._id,
        replies: item.replies,
        parentDeleted: item.parentDeleted,
        canEdit: user && user.uid == item.comment.userid,
        canVote: !!user,
        userid: user && user.uid,
        data: item.comment,
        user: user,
        db: db,
      })
    }.bind(this))

    return React.DOM.div({className: "commented_comments"}, 
      (isMain && organized.inlines) ? ShowAller({
        count: organized.inlines,
        showAll: this.state.showAll,
        onChange: this._onChangeShow
      }) : false, 
      comments
    );
  },

  render: function () {
    return React.DOM.div({className: "commented_main"}, 
      this.renderComments(), 
      React.DOM.div({className: "commented_add"}, 
        AddComment({
          autoAdd: this.props.startAdding, 
          noCancel: this.props.startAdding, 
          target: this.props.target, 
          user: this.props.user, 
          auth: this.props.auth, 
          db: this.props.db})
      ), 
      this.props.target === 'main' &&
        React.DOM.div({className: "commented_attribution"}, 
          "Comments powered by ", React.DOM.a({target: "_blank", href: "http://commented.github.io"}, "//commented")
        )
    );
  }
});

module.exports = ViewComments;

},{"./add-comment.jsx":2,"./comment.jsx":6,"./mixin":15,"./show-aller.jsx":18}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy5jb25maWcveWFybi9nbG9iYWwvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9odXl0cmFuL3dvcmtpbmcvZGV2L2Rldi13ZWIvZ2l0aHViLXJlcG9zL2NvbW1lbnRlZC9pbmRleC5qcyIsImxpYi9hZGQtY29tbWVudC5qc3giLCJsaWIvYXV0by10ZXh0YXJlYS5qc3giLCIvVXNlcnMvaHV5dHJhbi93b3JraW5nL2Rldi9kZXYtd2ViL2dpdGh1Yi1yZXBvcy9jb21tZW50ZWQvbGliL2NsZWFuLXNsdWcuanMiLCJsaWIvY29tbWVudC1kaXNwbGF5LmpzeCIsImxpYi9jb21tZW50LmpzeCIsImxpYi9jcmVhdGUtY29tbWVudC5qc3giLCIvVXNlcnMvaHV5dHJhbi93b3JraW5nL2Rldi9kZXYtd2ViL2dpdGh1Yi1yZXBvcy9jb21tZW50ZWQvbGliL2RiLWZpcmViYXNlLmpzIiwiL1VzZXJzL2h1eXRyYW4vd29ya2luZy9kZXYvZGV2LXdlYi9naXRodWItcmVwb3MvY29tbWVudGVkL2xpYi9kYi5qcyIsIi9Vc2Vycy9odXl0cmFuL3dvcmtpbmcvZGV2L2Rldi13ZWIvZ2l0aHViLXJlcG9zL2NvbW1lbnRlZC9saWIvZm9ybWF0LmpzIiwiL1VzZXJzL2h1eXRyYW4vd29ya2luZy9kZXYvZGV2LXdlYi9naXRodWItcmVwb3MvY29tbWVudGVkL2xpYi9pbmRleC5qcyIsImxpYi9pbmxpbmUtY29tbWVudHMuanN4IiwibGliL2xvZ2luLmpzeCIsImxpYi9tYWluLWNvbW1lbnRzLmpzeCIsIi9Vc2Vycy9odXl0cmFuL3dvcmtpbmcvZGV2L2Rldi13ZWIvZ2l0aHViLXJlcG9zL2NvbW1lbnRlZC9saWIvbWl4aW4uanMiLCIvVXNlcnMvaHV5dHJhbi93b3JraW5nL2Rldi9kZXYtd2ViL2dpdGh1Yi1yZXBvcy9jb21tZW50ZWQvbGliL25vLWphbmsuanMiLCJsaWIvcmVwbHktbG9naW4uanN4IiwibGliL3Nob3ctYWxsZXIuanN4IiwiL1VzZXJzL2h1eXRyYW4vd29ya2luZy9kZXYvZGV2LXdlYi9naXRodWItcmVwb3MvY29tbWVudGVkL2xpYi9zbGlkZS1kb3duLmpzIiwibGliL3ZpZXctY29tbWVudHMuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQ0E7QUFBQSxBQUFJLEVBQUEsQ0FBQSxTQUFRLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQTtBQUUvQixPQUFTLFlBQVUsQ0FBQyxBQUFDLENBQUU7QUFDbkIsT0FBTyxFQUFDLE1BQUssU0FBUyxLQUFLLEVBQUksQ0FBQSxNQUFLLFNBQVMsU0FBUyxDQUFDLENBQUM7QUFDNUQ7QUFBQSxBQUVBLE9BQU8saUJBQWlCLEFBQUMsQ0FBQyxrQkFBaUIsQ0FBRyxVQUFTLEFBQUMsQ0FBRTtBQUN4RCxBQUFJLElBQUEsQ0FBQSxJQUFHLEVBQUksQ0FBQSxRQUFPLGVBQWUsQUFBQyxDQUFDLGdCQUFlLENBQUMsQ0FBQztBQUNwRCxLQUFJLENBQUMsSUFBRyxDQUFHO0FBQ1QsVUFBTSxNQUFNLEFBQUMsQ0FBQyxnQ0FBK0IsQ0FBQyxDQUFDO0FBQy9DLFVBQU07RUFDUjtBQUFBLEFBQ0ksSUFBQSxDQUFBLE9BQU0sRUFBSTtBQUNaLFdBQU8sQ0FBRyxDQUFBLElBQUcsYUFBYSxBQUFDLENBQUMsZUFBYyxDQUFDO0FBQzNDLE9BQUcsQ0FBRyxXQUFTO0FBQ2YsT0FBRyxDQUFHLENBQUEsSUFBRyxhQUFhLEFBQUMsQ0FBQyxXQUFVLENBQUMsTUFBTSxBQUFDLENBQUMsR0FBRSxDQUFDO0FBQzlDLE9BQUcsQ0FBRyxDQUFBLElBQUcsYUFBYSxBQUFDLENBQUMsV0FBVSxDQUFDLENBQUEsRUFBSyxDQUFBLFdBQVUsQUFBQyxFQUFDO0FBQ3BELFNBQUssQ0FBRyxDQUFBLElBQUcsYUFBYSxBQUFDLENBQUMsYUFBWSxDQUFDO0FBQ3ZDLE9BQUcsQ0FBRyxLQUFHO0FBQUEsRUFDWCxDQUFBO0FBR0EsS0FBSSxDQUFDLE9BQU0sU0FBUyxDQUFHO0FBQ3JCLFVBQU0sTUFBTSxBQUFDLENBQUMsd0RBQXVELENBQUMsQ0FBQTtBQUN0RSxVQUFNO0VBQ1I7QUFBQSxBQUNBLFVBQVEsQUFBQyxDQUFDLE9BQU0sQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQztBQUVGOzs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUFBLEtBQUssUUFBUSxFQUFJLFVBQVEsQ0FBQTtBQUV6QixPQUFTLFVBQVEsQ0FBRSxJQUFHLENBQUc7QUFDdkIsT0FBTyxDQUFBLElBQUcsUUFBUSxBQUFDLENBQUMsZ0JBQWUsQ0FBRyxJQUFFLENBQUMsQ0FBQTtBQUMzQztBQUFBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUFBLEtBQUssUUFBUSxFQUFJLFdBQVMsQ0FBQTtBQUUxQixPQUFTLFdBQVMsQ0FBRSxPQUFNLENBQUc7QUFDM0IsS0FBRyxHQUFHLEVBQUksSUFBSSxTQUFPLEFBQUMsQ0FBQyxVQUFTLEVBQUksQ0FBQSxPQUFNLFNBQVMsQ0FBQSxDQUFJLDRCQUEwQixDQUFBLENBQUksQ0FBQSxPQUFNLEtBQUssQ0FBQyxDQUFDO0FBQ2xHLEFBQUksSUFBQSxDQUFBLE9BQU0sQ0FBQTtBQUNWLEtBQUcsR0FBRyxHQUFHLEFBQUMsQ0FBQyxPQUFNLENBQUcsQ0FBQSxPQUFNLEVBQUksQ0FBQSxTQUFTLEFBQUMsQ0FBRTtBQUN4QyxPQUFHLEdBQUcsSUFBSSxBQUFDLENBQUMsT0FBTSxDQUFHLFFBQU0sQ0FBQyxDQUFBO0FBQzVCLE9BQUcsT0FBTyxFQUFJLEtBQUcsQ0FBQTtFQUNuQixLQUFLLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2IsS0FBRyxLQUFLLEVBQUksS0FBRyxDQUFBO0FBQ2YsS0FBRyxRQUFRLEVBQUksUUFBTSxDQUFBO0FBRXJCLEtBQUcsTUFBTSxFQUFJLElBQUksb0JBQWtCLEFBQUMsQ0FBQyxJQUFHLEdBQUcsQ0FBRyxDQUFBLElBQUcsU0FBUyxLQUFLLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLEtBQUcsVUFBVSxFQUFJLEdBQUMsQ0FBQTtBQUNwQjtBQUFBLEFBRUEsU0FBUyxVQUFVLEVBQUk7QUFJckIsV0FBUyxDQUFHLFVBQVUsSUFBRyxDQUFHLENBQUEsTUFBSyxDQUFHLENBQUEsS0FBSSxDQUFHO0FBQ3pDLE9BQUksQ0FBQyxJQUFHLEtBQUssQ0FBRztBQUNkLFdBQU8sQ0FBQSxPQUFNLE1BQU0sQUFBQyxDQUFDLGVBQWMsQ0FBQyxDQUFDO0lBQ3ZDO0FBQUEsQUFDQSxPQUFHLEdBQUcsS0FBSyxBQUFDLENBQUM7QUFDWCxZQUFNLENBQUcsQ0FBQSxJQUFHLElBQUksQUFBQyxFQUFDO0FBQ2xCLGdCQUFVLENBQUcsQ0FBQSxJQUFHLEtBQUssWUFBWTtBQUNqQyxZQUFNLENBQUcsQ0FBQSxJQUFHLEtBQUssUUFBUTtBQUN6QixXQUFLLENBQUcsQ0FBQSxJQUFHLEtBQUssSUFBSTtBQUNwQixTQUFHLENBQUcsS0FBRztBQUNULFdBQUssQ0FBRyxPQUFLO0FBQ2IsVUFBSSxDQUFHLE1BQUk7QUFBQSxJQUNiLENBQUMsQ0FBQTtFQUNIO0FBRUEsWUFBVSxDQUFHLFVBQVUsRUFBQyxDQUFHLENBQUEsSUFBRyxDQUFHO0FBQy9CLE9BQUksQ0FBQyxJQUFHLEtBQUssQ0FBRztBQUNkLFdBQU8sQ0FBQSxPQUFNLE1BQU0sQUFBQyxDQUFDLGVBQWMsQ0FBQyxDQUFDO0lBQ3ZDO0FBQUEsQUFDQSxPQUFHLEdBQUcsTUFBTSxBQUFDLENBQUMsRUFBQyxDQUFDLE9BQU8sQUFBQyxDQUFDLENBQUMsSUFBRyxDQUFHLEtBQUcsQ0FBQyxDQUFDLENBQUE7RUFDdkM7QUFFQSxjQUFZLENBQUcsVUFBVSxFQUFDLENBQUc7QUFDM0IsT0FBSSxDQUFDLElBQUcsS0FBSyxDQUFHO0FBQ2QsV0FBTyxDQUFBLE9BQU0sTUFBTSxBQUFDLENBQUMsZUFBYyxDQUFDLENBQUM7SUFDdkM7QUFBQSxBQUNBLE9BQUcsR0FBRyxNQUFNLEFBQUMsQ0FBQyxFQUFDLENBQUMsT0FBTyxBQUFDLEVBQUMsQ0FBQTtFQUMzQjtBQUlBLEtBQUcsQ0FBRyxVQUFVLEVBQUMsQ0FBRyxDQUFBLEdBQUUsQ0FBRyxDQUFBLElBQUcsQ0FBRztBQUM3QixPQUFJLElBQUcsQ0FBRztBQUNSLFNBQUcsR0FBRyxNQUFNLEFBQUMsQ0FBQyxFQUFDLENBQUMsTUFBTSxBQUFDLENBQUMsT0FBTSxDQUFDLE1BQU0sQUFBQyxDQUFDLEdBQUUsQ0FBQyxJQUFJLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQTtJQUN0RCxLQUFPO0FBQ0wsU0FBRyxHQUFHLE1BQU0sQUFBQyxDQUFDLEVBQUMsQ0FBQyxNQUFNLEFBQUMsQ0FBQyxPQUFNLENBQUMsTUFBTSxBQUFDLENBQUMsR0FBRSxDQUFDLE9BQU8sQUFBQyxFQUFDLENBQUE7SUFDckQ7QUFBQSxFQUNGO0FBRUEsTUFBSSxDQUFHLFVBQVUsRUFBQyxDQUFHLENBQUEsR0FBRSxDQUFHO0FBQ3hCLE9BQUcsR0FBRyxNQUFNLEFBQUMsQ0FBQyxFQUFDLENBQUMsTUFBTSxBQUFDLENBQUMsT0FBTSxDQUFDLE1BQU0sQUFBQyxDQUFDLEdBQUUsQ0FBQyxJQUFJLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQTtFQUN0RDtBQUVBLFFBQU0sQ0FBRyxVQUFVLEVBQUMsQ0FBRyxDQUFBLEdBQUUsQ0FBRztBQUMxQixPQUFHLEdBQUcsTUFBTSxBQUFDLENBQUMsRUFBQyxDQUFDLE1BQU0sQUFBQyxDQUFDLE9BQU0sQ0FBQyxNQUFNLEFBQUMsQ0FBQyxHQUFFLENBQUMsT0FBTyxBQUFDLEVBQUMsQ0FBQTtFQUNyRDtBQUVBLE1BQUksQ0FBRyxVQUFVLElBQUcsQ0FBRztBQUNyQixPQUFHLE1BQU0sTUFBTSxBQUFDLENBQUMsSUFBRyxDQUFHLEVBQ3JCLFVBQVMsQ0FBRyxLQUFHLENBQ2pCLENBQUMsQ0FBQTtFQUNIO0FBRUEsU0FBTyxDQUFHLFVBQVUsR0FBRSxDQUFHLENBQUEsSUFBRyxDQUFHO0FBQzdCLE9BQUksR0FBRSxHQUFLLEVBQUMsSUFBRyxDQUFHO0FBQ2hCLFdBQU8sQ0FBQSxJQUFHLGFBQWEsQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFBO0lBQy9CO0FBQUEsQUFDQSxPQUFHLFFBQVEsRUFBSSxFQUFDLElBQUcsbUJBQW1CLGtCQUFrQixHQUN4QyxDQUFBLElBQUcsbUJBQW1CLFFBQVEsQ0FBQSxFQUM5QixDQUFBLElBQUcsbUJBQW1CLFdBQVcsQ0FBQyxDQUFBO0FBRWxELE9BQUksSUFBRyxRQUFRLEdBQUssQ0FBQSxJQUFHLFFBQVEsS0FBSyxDQUFHO0FBQ3JDLFNBQUcsUUFBUSxFQUFJLENBQUEsSUFBRyxRQUFRLEtBQUssSUFBSSxDQUFBO0lBQ3JDO0FBQUEsQUFDQSxPQUFHLEtBQUssRUFBSSxLQUFHLENBQUE7QUFDZixPQUFHLGFBQWEsQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFBO0VBQ3hCO0FBRUEsYUFBVyxDQUFHLFVBQVUsSUFBRyxDQUFHO0FBQzVCLE9BQUcsVUFBVSxRQUFRLEFBQUMsQ0FBQyxTQUFVLEVBQUMsQ0FBRztBQUNuQyxPQUFDLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQTtJQUNULENBQUMsQ0FBQTtFQUNIO0FBRUEsT0FBSyxDQUFHLFVBQVMsQUFBQyxDQUFFO0FBQ2xCLE9BQUcsTUFBTSxPQUFPLEFBQUMsRUFBQyxDQUFBO0VBQ3BCO0FBRUEsUUFBTSxDQUFHLFVBQVUsRUFBQyxDQUFHO0FBQ3JCLE9BQUcsVUFBVSxLQUFLLEFBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQTtFQUN4QjtBQUVBLFNBQU8sQ0FBRyxVQUFVLEVBQUMsQ0FBRztBQUN0QixBQUFJLE1BQUEsQ0FBQSxDQUFBLEVBQUksQ0FBQSxJQUFHLFVBQVUsUUFBUSxBQUFDLENBQUMsRUFBQyxDQUFDLENBQUE7QUFDakMsT0FBSSxDQUFBLElBQU0sRUFBQyxDQUFBO0FBQUcsWUFBSztBQUFBLEFBQ25CLE9BQUcsVUFBVSxPQUFPLEFBQUMsQ0FBQyxDQUFBLENBQUcsRUFBQSxDQUFDLENBQUE7RUFDNUI7QUFFQSxXQUFTLENBQUcsVUFBVSxJQUFHLENBQUc7QUFDMUIsQUFBSSxNQUFBLENBQUEsT0FBTSxDQUFBO0FBQ1YsT0FBRyxHQUFHLEdBQUcsQUFBQyxDQUFDLE9BQU0sQ0FBRyxDQUFBLE9BQU0sRUFBSSxDQUFBLFNBQVMsQUFBQyxDQUFFO0FBQ3hDLFNBQUcsQUFBQyxFQUFDLENBQUE7QUFDTCxTQUFHLEdBQUcsSUFBSSxBQUFDLENBQUMsT0FBTSxDQUFHLFFBQU0sQ0FBQyxDQUFBO0lBQzlCLEtBQUssQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLENBQUE7RUFDZDtBQUdBLE1BQUksQ0FBRyxVQUFVLEVBQUMsQ0FBRztBQUNuQixPQUFHLEdBQUcsR0FBRyxBQUFDLENBQUMsYUFBWSxDQUFHLFVBQVUsUUFBTyxDQUFHO0FBQzVDLEFBQUksUUFBQSxDQUFBLEdBQUUsRUFBSSxDQUFBLFFBQU8sSUFBSSxBQUFDLEVBQUMsQ0FBQTtBQUN2QixRQUFFLElBQUksRUFBSSxDQUFBLFFBQU8sS0FBSyxBQUFDLEVBQUMsQ0FBQTtBQUN4QixPQUFDLEFBQUMsQ0FBQyxHQUFFLENBQUMsQ0FBQztJQUNULENBQUMsQ0FBQztFQUNKO0FBQ0EsU0FBTyxDQUFHLFVBQVUsRUFBQyxDQUFHO0FBQ3RCLE9BQUcsR0FBRyxHQUFHLEFBQUMsQ0FBQyxlQUFjLENBQUcsVUFBVSxRQUFPLENBQUc7QUFDOUMsQUFBSSxRQUFBLENBQUEsR0FBRSxFQUFJLENBQUEsUUFBTyxJQUFJLEFBQUMsRUFBQyxDQUFBO0FBQ3ZCLFFBQUUsSUFBSSxFQUFJLENBQUEsUUFBTyxLQUFLLEFBQUMsRUFBQyxDQUFBO0FBQ3hCLE9BQUMsQUFBQyxDQUFDLEdBQUUsQ0FBQyxDQUFBO0lBQ1IsQ0FBQyxDQUFDO0VBQ0o7QUFDQSxTQUFPLENBQUcsVUFBVSxFQUFDLENBQUc7QUFDdEIsT0FBRyxHQUFHLEdBQUcsQUFBQyxDQUFDLGVBQWMsQ0FBRyxVQUFVLFFBQU8sQ0FBRztBQUM5QyxPQUFDLEFBQUMsQ0FBQyxRQUFPLEtBQUssQUFBQyxFQUFDLENBQUMsQ0FBQztJQUNyQixDQUFDLENBQUM7RUFDSjtBQUFBLEFBQ0YsQ0FBQTtBQUNBOzs7QUN6SUE7QUFBQSxBQUFJLEVBQUEsQ0FBQSxVQUFTLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxlQUFjLENBQUMsQ0FBQztBQUd6QyxLQUFLLFFBQVEsRUFBSSxVQUFVLE9BQU0sQ0FBRztBQUNsQyxTQUFRLE9BQU0sS0FBSztBQUlqQixPQUFLLFdBQVM7QUFDWixXQUFPLElBQUksV0FBUyxBQUFDLENBQUMsT0FBTSxDQUFDLENBQUM7QUFBQSxBQUNoQztBQUNFLFlBQU0sTUFBTSxBQUFDLENBQUMsMkJBQTBCLENBQUcsQ0FBQSxPQUFNLEtBQUssQ0FBRyxRQUFNLENBQUMsQ0FBQztBQUQ1RCxFQUVUO0FBQ0YsQ0FBQTtBQUVBOzs7QUNmQTtBQUFBLEdBQUksTUFBSyxPQUFPLENBQUc7QUFDakIsT0FBSyxXQUFXLEFBQUMsQ0FBQztBQUNoQixNQUFFLENBQUcsS0FBRztBQUNSLFNBQUssQ0FBRyxLQUFHO0FBQ1gsU0FBSyxDQUFHLEtBQUc7QUFDWCxXQUFPLENBQUcsTUFBSTtBQUNkLFdBQU8sQ0FBRyxLQUFHO0FBQ2IsYUFBUyxDQUFHLEtBQUc7QUFDZixjQUFVLENBQUcsS0FBRztBQUFBLEVBQ2xCLENBQUMsQ0FBQTtBQUNELE9BQUssUUFBUSxFQUFJLFVBQVUsSUFBRyxDQUFHLENBQUEsR0FBRSxDQUFHO0FBQ3BDLFNBQU8sQ0FBQSxLQUFJLElBQUksSUFBSSxBQUFDLENBQUM7QUFDbkIsY0FBUSxDQUFHLElBQUU7QUFDYiw0QkFBc0IsQ0FBRyxFQUN2QixNQUFLLENBQUcsQ0FBQSxNQUFLLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FDckI7QUFBQSxJQUNGLENBQUMsQ0FBQztFQUNKLENBQUE7QUFDRixLQUFPO0FBQ0wsT0FBSyxRQUFRLEVBQUksVUFBVSxDQUFBLENBQUcsQ0FBQSxHQUFFLENBQUc7QUFDakMsU0FBTyxDQUFBLEtBQUksSUFBSSxJQUFJLEFBQUMsQ0FBQyxDQUFDLFNBQVEsQ0FBRyxJQUFFLENBQUMsQ0FBRyxFQUFBLENBQUMsQ0FBQTtFQUMxQyxDQUFBO0FBQ0Y7QUFBQTs7O0FDdEJBO0FBQUEsQUFBSSxFQUFBLENBQUEsU0FBUSxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsaUJBQWdCLENBQUM7QUFDckMsUUFBSSxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsTUFBSyxDQUFDO0FBRXRCLGlCQUFhLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyx1QkFBc0IsQ0FBQztBQUNoRCxlQUFXLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxxQkFBb0IsQ0FBQyxDQUFBO0FBWWhELEtBQUssUUFBUSxFQUFJLFVBQVUsT0FBTTtBQUMvQixRQUFNLEtBQUssRUFBSSxDQUFBLFNBQVEsQUFBQyxDQUFDLE9BQU0sS0FBSyxDQUFDLENBQUE7QUFFckMsQUFBSSxJQUFBLENBQUEsRUFBQyxFQUFJLENBQUEsTUFBSyxHQUFHLEVBQUksQ0FBQSxLQUFJLEFBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQTtBQUNsQyxLQUFJLENBQUMsRUFBQztBQUFHLFNBQU8sQ0FBQSxPQUFNLE1BQU0sQUFBQyxDQUFDLHlCQUF3QixDQUFDLENBQUE7QUFBQSxBQUV2RCxLQUFJLE9BQU0sT0FBTyxDQUFJO0FBQ25CLEFBQUksTUFBQSxDQUFBLElBQUcsRUFBSSxDQUFBLFFBQU8sY0FBYyxBQUFDLENBQUMsT0FBTSxPQUFPLENBQUMsQ0FBQTtBQUNoRCxPQUFHLFVBQVUsSUFBSSxBQUFDLENBQUMsdUJBQXNCLENBQUMsQ0FBQTtBQUMxQyxBQUFJLE1BQUEsQ0FBQSxLQUFJLEVBQUksQ0FBQSxJQUFHLGlCQUFpQixBQUFDLENBQUMsT0FBTSxPQUFPLEVBQUksT0FBSyxDQUFDLENBQUE7QUFDekQsSUFBQTtBQUFDLEtBQUMsUUFBUSxLQUFLLEFBQUMsQ0FBQyxLQUFJLEdBQUcsU0FBQyxJQUFHLENBQUcsQ0FBQSxDQUFBLENBQU07QUFDbkMsQUFBSSxRQUFBLENBQUEsRUFBQyxFQUFJLENBQUEsSUFBRyxhQUFhLEFBQUMsQ0FBQyxpQkFBZ0IsQ0FBQyxDQUFBLEVBQUssRUFBQSxDQUFBO0FBQ2pELEFBQUksUUFBQSxDQUFBLE1BQUssRUFBSSxDQUFBLFFBQU8sY0FBYyxBQUFDLENBQUMsS0FBSSxDQUFDLENBQUE7QUFDekMsV0FBSyxVQUFVLEVBQUksMkJBQXlCLENBQUE7QUFDNUMsU0FBRyxVQUFVLElBQUksQUFBQyxDQUFDLG1CQUFrQixDQUFDLENBQUE7QUFDdEMsU0FBRyxZQUFZLEFBQUMsQ0FBQyxNQUFLLENBQUMsQ0FBQTtBQUN2QixVQUFJLGdCQUFnQixBQUFDLENBQUMsY0FBYSxBQUFDLENBQUM7QUFDbkMsYUFBSyxDQUFHLENBQUEsU0FBUSxFQUFJLEdBQUM7QUFDckIsV0FBRyxDQUFHLEtBQUc7QUFDVCxXQUFHLENBQUcsQ0FBQSxPQUFNLEtBQUs7QUFDakIsU0FBQyxDQUFHLEdBQUM7QUFBQSxNQUNQLENBQUMsQ0FBRyxPQUFLLENBQUMsQ0FBQztJQUNiLEVBQUMsQ0FBQztFQUNKO0FBQUEsQUFFQSxNQUFJLGdCQUFnQixBQUFDLENBQUMsWUFBVyxBQUFDLENBQUM7QUFDakMsT0FBRyxDQUFHLENBQUEsT0FBTSxLQUFLO0FBQ2pCLEtBQUMsQ0FBRyxHQUFDO0FBQUEsRUFDUCxDQUFDLENBQUcsQ0FBQSxPQUFNLEtBQUssQ0FBQyxDQUFDO0FBQ25CLENBQUE7QUFFQTs7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFBQSxBQUFJLEVBQUEsQ0FBQSxFQUFDLEVBQUksQ0FBQSxLQUFJLE9BQU8sT0FBTyxDQUFBO0FBRTNCLEtBQUssUUFBUSxFQUFJO0FBQ2YsVUFBUSxDQUFHO0FBQ1QsS0FBQyxDQUFHLENBQUEsS0FBSSxVQUFVLE9BQU8sV0FBVztBQUNwQyxPQUFHLENBQUcsQ0FBQSxLQUFJLFVBQVUsTUFBTSxXQUFXO0FBQUEsRUFDdkM7QUFFQSxnQkFBYyxDQUFHLFVBQVMsQUFBQyxDQUFFO0FBQzNCLFNBQU87QUFDTCxhQUFPLENBQUcsR0FBQztBQUNYLFlBQU0sQ0FBRyxFQUFDLElBQUcsTUFBTSxHQUFHLE9BQU87QUFDN0IsU0FBRyxDQUFHLEtBQUc7QUFBQSxJQUNYLENBQUE7RUFDRjtBQUVBLFNBQU8sQ0FBRyxVQUFVLElBQUcsQ0FBRztBQUN4QixPQUFHLFNBQVMsQUFBQyxDQUFDLENBQUMsSUFBRyxDQUFHLEtBQUcsQ0FBQyxDQUFDLENBQUE7RUFDNUI7QUFFQSxVQUFRLENBQUcsVUFBUyxBQUFDLENBQUU7QUFDckIsT0FBRyxTQUFTLEFBQUMsQ0FBQyxDQUFDLE9BQU0sQ0FBRyxNQUFJLENBQUMsQ0FBQyxDQUFBO0VBQ2hDO0FBRUEscUJBQW1CLENBQUcsVUFBUyxBQUFDLENBQUU7QUFDaEMsT0FBRyxNQUFNLEdBQUcsU0FBUyxBQUFDLENBQUMsSUFBRyxTQUFTLENBQUMsQ0FBQTtFQUN0QztBQUVBLGtCQUFnQixDQUFHLFVBQVMsQUFBQyxDQUFFO0FBQzdCLE9BQUcsTUFBTSxHQUFHLFFBQVEsQUFBQyxDQUFDLElBQUcsU0FBUyxDQUFDLENBQUE7QUFDbkMsT0FBSSxDQUFDLElBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBRztBQUN6QixTQUFHLE1BQU0sR0FBRyxXQUFXLEFBQUMsQ0FBQyxJQUFHLFVBQVUsQ0FBQyxDQUFBO0lBQ3pDO0FBQUEsQUFDQSxPQUFHLE1BQU0sR0FBRyxNQUFNLEFBQUMsQ0FBQyxJQUFHLFNBQVMsQ0FBQyxDQUFDO0FBQ2xDLE9BQUcsTUFBTSxHQUFHLFNBQVMsQUFBQyxDQUFDLElBQUcsV0FBVyxDQUFDLENBQUM7QUFDdkMsT0FBRyxNQUFNLEdBQUcsU0FBUyxBQUFDLENBQUMsSUFBRyxXQUFXLENBQUMsQ0FBQztBQUN2QyxPQUFHLFNBQVMsQUFBQyxDQUFDLENBQUMsSUFBRyxDQUFHLENBQUEsSUFBRyxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztFQUMzQztBQUVBLGlCQUFlLENBQUcsVUFBUyxBQUFDOztBQUMxQixBQUFJLE1BQUEsQ0FBQSxHQUFFLEVBQUksQ0FBQSxNQUFLLEtBQUssQUFBQyxDQUFDLElBQUcsTUFBTSxTQUFTLENBQUM7QUFDckMsZUFBTyxFQUFJLENBQUEsSUFBRyxNQUFNLFNBQVM7QUFDN0IsY0FBTSxFQUFJLENBQUEsSUFBRyxNQUFNLFFBQVE7QUFDM0IsYUFBSyxFQUFJLENBQUEsSUFBRyxNQUFNLE9BQU8sSUFBTSxPQUFLO0FBQ3BDLGlCQUFTLEVBQUksRUFBQTtBQUNiLGNBQU0sRUFBSSxHQUFDO0FBQ1gsVUFBRSxFQUFJLEdBQUM7QUFDUCxXQUFHLEVBQUksR0FBQyxDQUFBO0FBRVosT0FBSSxDQUFDLEdBQUUsT0FBTztBQUFHLFdBQU8sS0FBRyxDQUFBO0FBQUEsQUFFM0IsTUFBRSxRQUFRLEFBQUMsRUFBQyxTQUFDLEVBQUMsQ0FBTTtBQUNsQixTQUFJLENBQUMsUUFBTyxDQUFFLEVBQUMsQ0FBQztBQUFHLGNBQUs7QUFBQSxBQUNwQixRQUFBLENBQUEsSUFBRyxFQUFJO0FBQ1QsY0FBTSxDQUFHLENBQUEsUUFBTyxDQUFFLEVBQUMsQ0FBQztBQUNwQixjQUFNLENBQUcsR0FBQztBQUFBLE1BQ1osQ0FBQTtBQUNBLEFBQUksUUFBQSxDQUFBLE1BQUssRUFBSSxDQUFBLFFBQU8sQ0FBRSxFQUFDLENBQUMsT0FBTyxDQUFBO0FBQy9CLFFBQUUsQ0FBRSxFQUFDLENBQUMsRUFBSSxLQUFHLENBQUE7QUFDYixTQUFJLE1BQUssSUFBTSxDQUFBLFVBQVMsT0FBTyxDQUFHO0FBQ2hDLFdBQUcsS0FBSyxBQUFDLENBQUMsSUFBRyxDQUFDLENBQUE7TUFDaEIsS0FBTyxLQUFJLE1BQUssR0FBSyxDQUFBLE1BQUssUUFBUSxBQUFDLENBQUMsU0FBUSxDQUFDLENBQUEsR0FBTSxFQUFBLENBQUc7QUFDcEQsaUJBQVMsR0FBSyxFQUFBLENBQUE7QUFDZCxXQUFJLE9BQU0sQ0FBRztBQUNULGFBQUcsS0FBSyxBQUFDLENBQUMsSUFBRyxDQUFDLENBQUE7UUFDbEI7QUFBQSxNQUNGLEtBQU8sS0FBSSxNQUFLLFFBQVEsQUFBQyxDQUFDLFFBQU8sQ0FBQyxDQUFBLEdBQU0sRUFBQSxDQUFHO0FBQ3pDLGNBQU0sS0FBSyxBQUFDLENBQUMsUUFBTyxDQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUE7TUFDM0I7QUFBQSxJQUNGLEVBQUMsQ0FBQTtBQUVELFVBQU0sUUFBUSxBQUFDLENBQUMsU0FBVSxPQUFNLENBQUc7QUFDakMsQUFBSSxRQUFBLENBQUEsTUFBSyxFQUFJLENBQUEsT0FBTSxPQUFPLE1BQU0sQUFBQyxDQUFDLFFBQU8sT0FBTyxDQUFDLENBQUE7QUFDakQsU0FBSSxDQUFDLEdBQUUsQ0FBRSxNQUFLLENBQUMsQ0FBRztBQUNoQixXQUFJLE1BQUssQ0FBRztBQUVSLGFBQUcsS0FBSyxBQUFDLENBQUM7QUFDTixrQkFBTSxDQUFHLFFBQU07QUFDZix3QkFBWSxDQUFHLEtBQUc7QUFDbEIsa0JBQU0sQ0FBRyxHQUFDO0FBQUEsVUFDZCxDQUFDLENBQUE7UUFDTDtBQUFBLEFBQ0EsY0FBSztNQUNQO0FBQUEsQUFDQSxRQUFFLENBQUUsTUFBSyxDQUFDLFFBQVEsS0FBSyxBQUFDLENBQUMsT0FBTSxDQUFDLENBQUE7SUFDbEMsQ0FBQyxDQUFDO0FBRUYsU0FBTztBQUNMLFNBQUcsQ0FBRyxLQUFHO0FBQ1QsZUFBUyxDQUFHLFdBQVM7QUFBQSxJQUN2QixDQUFBO0VBQ0Y7QUFHQSxTQUFPLENBQUcsVUFBVSxPQUFNLENBQUc7QUFDM0IsQUFBSSxNQUFBLENBQUEsTUFBSyxFQUFJLEdBQUMsQ0FBQTtBQUNkLFNBQUssQ0FBRSxPQUFNLElBQUksQ0FBQyxFQUFJLEVBQUMsSUFBRyxDQUFHLFFBQU0sQ0FBQyxDQUFBO0FBQ3BDLE9BQUcsU0FBUyxBQUFDLENBQUMsQ0FDVixRQUFPLENBQUcsQ0FBQSxFQUFDLEFBQUMsQ0FBQyxJQUFHLE1BQU0sU0FBUyxDQUFHLE9BQUssQ0FBQyxDQUM1QyxDQUFDLENBQUE7RUFDSDtBQUVBLFdBQVMsQ0FBRyxVQUFVLE9BQU0sQ0FBRztBQUM3QixBQUFJLE1BQUEsQ0FBQSxNQUFLLEVBQUksR0FBQyxDQUFBO0FBQ2QsU0FBSyxDQUFFLE9BQU0sSUFBSSxDQUFDLEVBQUksRUFBQyxJQUFHLENBQUcsUUFBTSxDQUFDLENBQUE7QUFDcEMsT0FBRyxTQUFTLEFBQUMsQ0FBQyxDQUNWLFFBQU8sQ0FBRyxDQUFBLEVBQUMsQUFBQyxDQUFDLElBQUcsTUFBTSxTQUFTLENBQUcsT0FBSyxDQUFDLENBQzVDLENBQUMsQ0FBQTtFQUNIO0FBRUEsV0FBUyxDQUFHLFVBQVUsRUFBQyxDQUFHO0FBQ3hCLEFBQUksTUFBQSxDQUFBLE1BQUssRUFBSSxHQUFDLENBQUE7QUFDZCxTQUFLLENBQUUsRUFBQyxDQUFDLEVBQUksRUFBQyxJQUFHLENBQUcsS0FBRyxDQUFDLENBQUE7QUFDeEIsT0FBRyxTQUFTLEFBQUMsQ0FBQyxDQUNWLFFBQU8sQ0FBRyxDQUFBLEVBQUMsQUFBQyxDQUFDLElBQUcsTUFBTSxTQUFTLENBQUcsT0FBSyxDQUFDLENBQzVDLENBQUMsQ0FBQTtFQUNIO0FBQUEsQUFDRixDQUFBO0FBQ0E7OztBQ3RIQTtBQUFBLEtBQUssUUFBUSxFQUFJO0FBQ2Ysa0JBQWdCLENBQUcsVUFBUyxBQUFDLENBQUU7QUFDN0IsQUFBSSxNQUFBLENBQUEsSUFBRyxFQUFJLENBQUEsSUFBRyxXQUFXLEFBQUMsRUFBQyxDQUFBO0FBQzNCLE9BQUcsUUFBUSxFQUFJLENBQUEsSUFBRyxzQkFBc0IsQUFBQyxFQUFDLE9BQU8sQ0FBQTtFQUNuRDtBQUNBLG1CQUFpQixDQUFHLFVBQVMsQUFBQyxDQUFFO0FBQzlCLEFBQUksTUFBQSxDQUFBLFVBQVMsRUFBSSxDQUFBLElBQUcsUUFBUTtBQUN4QixXQUFHLEVBQUksQ0FBQSxJQUFHLFdBQVcsQUFBQyxFQUFDO0FBQ3ZCLFVBQUUsRUFBSSxDQUFBLElBQUcsTUFBTSxTQUFTLEVBQUksR0FBQyxDQUFBO0FBQ2pDLE9BQUcsTUFBTSxpQkFBaUIsRUFBSSxHQUFDLENBQUE7QUFDL0IsT0FBRyxNQUFNLE9BQU8sRUFBSSxPQUFLLENBQUE7QUFDekIsQUFBSSxNQUFBLENBQUEsU0FBUSxFQUFJLENBQUEsSUFBRyxRQUFRLEVBQUksQ0FBQSxJQUFHLHNCQUFzQixBQUFDLEVBQUMsT0FBTyxDQUFBO0FBQ2pFLE9BQUcsTUFBTSxPQUFPLEVBQUksQ0FBQSxVQUFTLEVBQUksS0FBRyxDQUFDO0FBQ3JDLGFBQVMsQUFBQyxDQUFDLFNBQVMsQUFBQyxDQUFFO0FBQ3JCLFNBQUcsTUFBTSxpQkFBaUIsRUFBSSxDQUFBLFNBQVEsRUFBSSxJQUFFLENBQUEsQ0FBSSxTQUFPLENBQUM7QUFDeEQsU0FBRyxNQUFNLE9BQU8sRUFBSSxVQUFRLENBQUE7SUFDOUIsQ0FBRyxFQUFBLENBQUMsQ0FBQztFQUNQO0FBQUEsQUFDRixDQUFBO0FBRUE7OztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFBQSxLQUFLLFFBQVEsRUFBSTtBQUNmLGtCQUFnQixDQUFHLFVBQVMsQUFBQyxDQUFFO0FBQzdCLEFBQUksTUFBQSxDQUFBLElBQUcsRUFBSSxDQUFBLElBQUcsV0FBVyxBQUFDLEVBQUM7QUFDdkIsWUFBSSxFQUFJLENBQUEsTUFBSyxpQkFBaUIsQUFBQyxDQUFDLElBQUcsQ0FBQztBQUNwQyxhQUFLLEVBQUksQ0FBQSxVQUFTLEFBQUMsQ0FBQyxLQUFJLE9BQU8sQ0FBQztBQUNoQyxvQkFBWSxFQUFJLENBQUEsS0FBSSxjQUFjLENBQUE7QUFFdEMsT0FBRyxNQUFNLEVBQUksQ0FBQSxJQUFHLFNBQVMsQUFBQyxFQUFDLENBQUE7QUFHM0IsT0FBRyxNQUFNLE9BQU8sRUFBSSxDQUFBLElBQUcsTUFBTSxZQUFZLEdBQUssRUFBQSxDQUFDO0FBQy9DLE9BQUcsTUFBTSxRQUFRLEVBQUksRUFBQSxDQUFDO0FBQ3RCLE9BQUcsTUFBTSxTQUFTLEVBQUksU0FBTyxDQUFDO0FBQzlCLE9BQUcsTUFBTSxjQUFjLEVBQUksRUFBQSxDQUFDO0FBRzVCLEFBQUksTUFBQSxDQUFBLEtBQUksRUFBSSxDQUFBLE1BQUssaUJBQWlCLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQztBQUN6QyxBQUFJLE1BQUEsQ0FBQSxHQUFFLEVBQUksQ0FBQSxJQUFHLE1BQU0sU0FBUyxDQUFDO0FBRTdCLGFBQVMsQUFBQyxDQUFDLFNBQVMsQUFBQyxDQUFFO0FBQ3JCLFNBQUcsTUFBTSxXQUFXLEVBQUksQ0FBQSxTQUFRLEVBQUksSUFBRSxDQUFBLENBQUksbUJBQWlCLENBQUEsQ0FBSSxJQUFFLENBQUEsQ0FBSSwwQkFBd0IsQ0FBQSxDQUFJLElBQUUsQ0FBQSxDQUFJLFNBQU8sQ0FBQztBQUMvRyxTQUFHLE1BQU0sT0FBTyxFQUFJLENBQUEsTUFBSyxFQUFJLEtBQUcsQ0FBQztBQUNqQyxTQUFHLE1BQU0sY0FBYyxFQUFJLGNBQVksQ0FBQztBQUN4QyxTQUFHLE1BQU0sUUFBUSxFQUFJLEVBQUEsQ0FBQztJQUN4QixDQUFHLEVBQUEsQ0FBQyxDQUFDO0FBR0wsV0FBUyxJQUFFLENBQUMsQUFBQyxDQUFFO0FBQ2IsU0FBRyxvQkFBb0IsQUFBQyxDQUFDLGVBQWMsQ0FBRyxJQUFFLENBQUMsQ0FBQztBQUM5QyxTQUFHLE1BQU0sT0FBTyxFQUFJLE9BQUssQ0FBQztJQUM1QjtBQUFBLEFBQ0EsT0FBRyxpQkFBaUIsQUFBQyxDQUFDLGVBQWMsQ0FBRyxJQUFFLENBQUMsQ0FBQztFQUM3QztBQUVBLFVBQVEsQ0FBRyxVQUFVLElBQUcsQ0FBRztBQUN6QixBQUFJLE1BQUEsQ0FBQSxJQUFHLEVBQUksQ0FBQSxJQUFHLFdBQVcsQUFBQyxFQUFDLENBQUE7QUFDM0IsQUFBSSxNQUFBLENBQUEsS0FBSSxFQUFJLENBQUEsTUFBSyxpQkFBaUIsQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFDO0FBQ3pDLE9BQUcsTUFBTSxPQUFPLEVBQUksQ0FBQSxLQUFJLE9BQU8sQ0FBQTtBQUMvQixBQUFJLE1BQUEsQ0FBQSxHQUFFLEVBQUksQ0FBQSxJQUFHLHNCQUFzQixBQUFDLEVBQUMsQ0FBQTtBQUNyQyxPQUFHLE1BQU0sT0FBTyxFQUFJLENBQUEsQ0FBQyxJQUFHLE1BQU0sWUFBWSxHQUFLLEVBQUEsQ0FBQyxFQUFJLEtBQUcsQ0FBQztBQUN4RCxPQUFHLE1BQU0sUUFBUSxFQUFJLEVBQUEsQ0FBQztBQUN0QixPQUFHLE1BQU0sY0FBYyxFQUFJLEVBQUEsQ0FBQztBQUM1QixXQUFTLElBQUUsQ0FBQyxBQUFDLENBQUU7QUFDYixTQUFHLG9CQUFvQixBQUFDLENBQUMsZUFBYyxDQUFHLElBQUUsQ0FBQyxDQUFDO0FBQzlDLFNBQUcsR0FBSyxDQUFBLElBQUcsQUFBQyxFQUFDLENBQUM7SUFDaEI7QUFBQSxBQUNBLE9BQUcsaUJBQWlCLEFBQUMsQ0FBQyxlQUFjLENBQUcsSUFBRSxDQUFDLENBQUM7RUFFN0M7QUFBQSxBQUNGLENBQUE7QUFFQTs7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLG51bGwsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIExvZ2luID0gcmVxdWlyZSgnLi9sb2dpbi5qc3gnKVxuICAsIENyZWF0ZUNvbW1lbnQgPSByZXF1aXJlKCcuL2NyZWF0ZS1jb21tZW50LmpzeCcpXG4gICwgTm9KYW5rID0gcmVxdWlyZSgnLi9uby1qYW5rLmpzJylcblxudmFyIEFkZENvbW1lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBZGRDb21tZW50JyxcbiAgLy8gbWl4aW5zOiBbU2xpZGVEb3duXSxcbiAgc2xpZGU6IHtcbiAgICBkdXJhdGlvbjogM1xuICB9LFxuICBwcm9wVHlwZXM6IHtcbiAgICB1c2VyOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxuICAgIGF1dG9BZGQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG5vQ2FuY2VsOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgfSxcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZGluZzogZmFsc2VcbiAgICB9XG4gIH0sXG4gIG9uU2hvdzogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2FkZGluZzogdHJ1ZX0pO1xuICB9LFxuICBvbkhpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHthZGRpbmc6IGZhbHNlfSk7XG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZS5hZGRpbmcgJiYgIXRoaXMucHJvcHMuYXV0b0FkZCkge1xuICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJhZGQtY29tbWVudFwiLCBvbkNsaWNrOiB0aGlzLm9uU2hvd30sIFxuICAgICAgICBcIkFkZCBhIGNvbW1lbnRcIlxuICAgICAgKVxuICAgIH1cbiAgICBpZiAoIXRoaXMucHJvcHMudXNlcikge1xuICAgICAgcmV0dXJuIExvZ2luKHtkYjogdGhpcy5wcm9wcy5kYiwgYXV0aDogdGhpcy5wcm9wcy5hdXRoLCBvbkNhbmNlbDogIXRoaXMucHJvcHMubm9DYW5jZWwgJiYgdGhpcy5vbkhpZGV9KVxuICAgIH1cbiAgICByZXR1cm4gQ3JlYXRlQ29tbWVudCh7XG4gICAgICBvbkhpZGU6ICF0aGlzLnByb3BzLm5vQ2FuY2VsICYmIHRoaXMub25IaWRlLCBcbiAgICAgIHRhcmdldDogdGhpcy5wcm9wcy50YXJnZXQsIFxuICAgICAgZGI6IHRoaXMucHJvcHMuZGIsIFxuICAgICAgdXNlcjogdGhpcy5wcm9wcy51c2VyfSlcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWRkQ29tbWVudFxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgQXV0b1RleHRhcmVhID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQXV0b1RleHRhcmVhJyxcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0RE9NTm9kZSgpXG4gICAgbm9kZS5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICBub2RlLnN0eWxlLmhlaWdodCA9IG5vZGUuc2Nyb2xsSGVpZ2h0ICsgJ3B4J1xuICAgIG5vZGUuc3R5bGUuc2Nyb2xsVG9wID0gbm9kZS5zY3JvbGxIZWlnaHRcbiAgICBub2RlLmZvY3VzKClcbiAgICBub2RlLnNlbGVjdGlvblN0YXJ0ID0gbm9kZS5zZWxlY3Rpb25FbmQgPSBub2RlLnZhbHVlLmxlbmd0aFxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzdHlsZVxuICAgICAgLCBub2RlXG5cbiAgICBpZiAodGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgbm9kZSA9IHRoaXMuZ2V0RE9NTm9kZSgpXG4gICAgICBub2RlLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgbm9kZS5zdHlsZS5oZWlnaHQgPSBub2RlLnNjcm9sbEhlaWdodCArICdweCdcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBoZWlnaHQ6IG5vZGUuc2Nyb2xsSGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgc2Nyb2xsVG9wOiBub2RlLnNjcm9sbEhlaWdodFxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00udGV4dGFyZWEoe3N0eWxlOiBzdHlsZSwgY2xhc3NOYW1lOiBcImF1dG8tdGV4dGFyZWFcIn0pXG4gICAgKVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdXRvVGV4dGFyZWFcbiIsbnVsbCwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgZm9ybWF0ID0gcmVxdWlyZSgnLi9mb3JtYXQnKVxuICAsIEF1dG9UZXh0YXJlYSA9IHJlcXVpcmUoJy4vYXV0by10ZXh0YXJlYS5qc3gnKVxuICAsIFJlcGx5TG9naW4gPSByZXF1aXJlKCcuL3JlcGx5LWxvZ2luLmpzeCcpXG4gICwgY3ggPSBSZWFjdC5hZGRvbnMuY2xhc3NTZXRcbiAgLCBTbGlkZURvd24gPSByZXF1aXJlKCcuL3NsaWRlLWRvd24uanMnKVxuICAsIFBUID0gUmVhY3QuUHJvcFR5cGVzXG5cbnZhciBDb21tZW50RGlzcGxheSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0NvbW1lbnREaXNwbGF5JyxcbiAgbWl4aW5zOiBbU2xpZGVEb3duXSxcbiAgZ2V0U2xpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZHVyYXRpb246IC4zLFxuICAgICAgY2xvc2VIZWlnaHQ6IHRoaXMucHJvcHMuY3JlYXRpbmcgJiYgIXRoaXMucHJvcHMuaXNSZXBseSA/IDMwIDogMFxuICAgIH1cbiAgfSxcbiAgcHJvcFR5cGVzOiB7XG4gICAgZWRpdGluZzogUmVhY3QuUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICBjYW5FZGl0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkYXRhOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgY3JlYXRpbmc6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGlzUmVwbHk6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXG4gICAgb25FZGl0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBkb25lRWRpdGluZzogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgb25SZW1vdmU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZlR5cGUoW1xuICAgICAgUFQuYm9vbCwgUFQuZnVuY1xuICAgIF0pLFxuICAgIG9uTG9nb3V0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcblxuICAgIG9uUmVwbHk6IFBULm9uZU9mVHlwZShbXG4gICAgICBQVC5ib29sLCBQVC5mdW5jXG4gICAgXSksXG4gICAgb25IZWFydDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgb25VbkhlYXJ0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBvbkZsYWc6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0OiB0aGlzLnByb3BzLmRhdGEudGV4dCxcbiAgICB9XG4gIH0sXG5cbiAgb25Mb2dvdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNsaWRlQXdheSh0aGlzLnByb3BzLm9uTG9nb3V0KVxuICB9LFxuXG4gIG9uUmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zbGlkZUF3YXkodGhpcy5wcm9wcy5vblJlbW92ZSlcbiAgfSxcblxuICBjYW5jZWxFZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7dGV4dDogdGhpcy5wcm9wcy5kYXRhLnRleHR9KVxuICAgIGlmICh0aGlzLnByb3BzLmNyZWF0aW5nKSB7XG4gICAgICB0aGlzLnNsaWRlQXdheSh0aGlzLnByb3BzLmNhbmNlbEVkaXQpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHJvcHMuY2FuY2VsRWRpdCgpO1xuICAgIH1cbiAgfSxcblxuICBkb25lRWRpdGluZzogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZS50ZXh0KSByZXR1cm5cbiAgICBpZiAodGhpcy5wcm9wcy5jcmVhdGluZykge1xuICAgICAgdGhpcy5zbGlkZUF3YXkodGhpcy5wcm9wcy5kb25lRWRpdGluZy5iaW5kKG51bGwsIHRoaXMuc3RhdGUudGV4dCkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHJvcHMuZG9uZUVkaXRpbmcodGhpcy5zdGF0ZS50ZXh0KVxuICAgIH1cbiAgfSxcblxuICBvbkNoYW5nZTogZnVuY3Rpb24gKGUpIHtcbiAgICB0aGlzLnNldFN0YXRlKHt0ZXh0OiBlLnRhcmdldC52YWx1ZX0pO1xuICB9LFxuXG4gIGdldFZvdGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHZvdGVzID0ge1xuICAgICAgaGVhcnQ6IGZhbHNlLFxuICAgICAgaGVhcnRDb3VudDogMCxcbiAgICAgIGZsYWdnZWQ6IHRoaXMucHJvcHMuZGF0YS5mbGFncyAmJiB0aGlzLnByb3BzLmRhdGEuZmxhZ3NbdGhpcy5wcm9wcy51c2VyaWRdLFxuICAgICAgZmxhZ0NvdW50OiAwXG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuZGF0YS52b3RlcyAmJiB0aGlzLnByb3BzLmRhdGEudm90ZXNbdGhpcy5wcm9wcy51c2VyaWRdKSB7XG4gICAgICB2b3Rlcy5oZWFydCA9IHRydWVcbiAgICB9XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5wcm9wcy5kYXRhLnZvdGVzKSB7XG4gICAgICB2b3Rlcy5oZWFydENvdW50ICs9IDFcbiAgICB9XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5wcm9wcy5kYXRhLmZsYWdzKSB7XG4gICAgICBpZiAodGhpcy5wcm9wcy5kYXRhLmZsYWdzW2lkXSkge1xuICAgICAgICB2b3Rlcy5mbGFnQ291bnQgKz0gMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdm90ZXNcbiAgfSxcblxuICB2b3RlQnV0dG9uczogZnVuY3Rpb24gKHZvdGVzKSB7XG4gICAgaWYgKCF0aGlzLnByb3BzLmNhblZvdGUpIHJldHVyblxuXG4gICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJjb21tZW50ZWRfYnV0dG9uc1wifSwgXG4gICAgICBSZWFjdC5ET00uc3Bhbih7XG4gICAgICAgIG9uQ2xpY2s6IHRoaXMucHJvcHMub25GbGFnLmJpbmQobnVsbCwgIXZvdGVzLmZsYWdnZWQpLCBcbiAgICAgICAgY2xhc3NOYW1lOiBjeCh7XG4gICAgICAgICAgXCJidXR0b24gY29tbWVudGVkX2ZsYWdcIjogdHJ1ZSxcbiAgICAgICAgICBcImNvbW1lbnRlZF9mbGFnLS1hY3RpdmVcIjogdm90ZXMuZmxhZ2dlZFxuICAgICAgICB9KX0sIFxuICAgICAgICBSZWFjdC5ET00uaSh7Y2xhc3NOYW1lOiBcImZhIGZhLWZsYWdcIn0pXG4gICAgICApLCBcbiAgICAgIFJlYWN0LkRPTS5zcGFuKHtcbiAgICAgICAgb25DbGljazogdm90ZXMuaGVhcnQgPyB0aGlzLnByb3BzLm9uVW5IZWFydCA6IHRoaXMucHJvcHMub25IZWFydCwgXG4gICAgICAgIGNsYXNzTmFtZTogY3goe1xuICAgICAgICAgIFwiYnV0dG9uIGNvbW1lbnRlZF9oZWFydFwiOiB0cnVlLFxuICAgICAgICAgIFwiY29tbWVudGVkX2hlYXJ0LS1zaG93biBzaG93blwiOiAhIXZvdGVzLmhlYXJ0Q291bnQsXG4gICAgICAgICAgXCJjb21tZW50ZWRfaGVhcnQtLWFjdGl2ZSBhY3RpdmVcIjogdm90ZXMuaGVhcnRcbiAgICAgICAgfSl9LCBcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oe2NsYXNzTmFtZTogXCJjb3VudFwifSwgdm90ZXMuaGVhcnRDb3VudCksIFxuICAgICAgICBSZWFjdC5ET00uaSh7Y2xhc3NOYW1lOiBcImZhIGZhLWhlYXJ0XCJ9KVxuICAgICAgKSwgXG4gICAgICAhdGhpcy5wcm9wcy5pc1JlcGx5ICYmIFJlYWN0LkRPTS5zcGFuKHtvbkNsaWNrOiB0aGlzLnByb3BzLm9uUmVwbHksIGNsYXNzTmFtZTogXCJjb21tZW50ZWRfcmVwbHlcIn0sIFwicmVwbHlcIilcbiAgICApO1xuICB9LFxuXG4gIGVkaXRCdXR0b25zOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJjb21tZW50ZWRfYnV0dG9uc1wifSwgXG4gICAgICBSZWFjdC5ET00uc3Bhbih7b25DbGljazogdGhpcy5kb25lRWRpdGluZywgY2xhc3NOYW1lOiBcImNvbW1lbnRlZF9kb25lLWVkaXQgYnV0dG9uXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jcmVhdGluZyA/ICdwb3N0JyA6ICdzYXZlJ1xuICAgICAgKSwgXG4gICAgICB0aGlzLnByb3BzLmNhbmNlbEVkaXQgJiZcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oe29uQ2xpY2s6IHRoaXMuY2FuY2VsRWRpdCwgY2xhc3NOYW1lOiBcImNvbW1lbnRlZF9yZW1vdmUgYnV0dG9uXCJ9LCBcbiAgICAgICAgICAgIFwiY2FuY2VsXCJcbiAgICAgICAgKVxuICAgIClcbiAgfSxcblxuICByZXBseUxvZ2luOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuaXNSZXBseSkgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJjb21tZW50ZWRfYnV0dG9uc1wifSwgXG4gICAgICBSZXBseUxvZ2luKHtcbiAgICAgICAgZGI6IHRoaXMucHJvcHMuZGIsIFxuICAgICAgICBhdXRoOiB0aGlzLnByb3BzLmRiLm9wdGlvbnMuYXV0aCwgXG4gICAgICAgIG9uQ2FuY2VsOiB0aGlzLnByb3BzLmNhbmNlbFJlcGx5LCBcbiAgICAgICAgb25SZXBseTogdGhpcy5wcm9wcy5vblJlcGx5fSlcbiAgICApXG4gIH0sXG5cbiAgYnV0dG9uczogZnVuY3Rpb24gKHZvdGVzKSB7XG4gICAgaWYgKCF0aGlzLnByb3BzLnVzZXJpZCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVwbHlMb2dpbigpXG4gICAgfVxuICAgIGlmICghdGhpcy5wcm9wcy5jYW5FZGl0KSB7XG4gICAgICByZXR1cm4gdGhpcy52b3RlQnV0dG9ucyh2b3RlcylcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuZWRpdGluZykge1xuICAgICAgcmV0dXJuIHRoaXMuZWRpdEJ1dHRvbnMoKVxuICAgIH1cbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImNvbW1lbnRlZF9idXR0b25zXCJ9LCBcbiAgICAgIFJlYWN0LkRPTS5zcGFuKHtvbkNsaWNrOiB0aGlzLnByb3BzLm9uRWRpdCwgY2xhc3NOYW1lOiBcImNvbW1lbnRlZF9lZGl0IGJ1dHRvblwifSwgXG4gICAgICAgIFJlYWN0LkRPTS5pKHtjbGFzc05hbWU6IFwiZmEgZmEtcGVuY2lsXCJ9KVxuICAgICAgKSwgXG4gICAgICBSZWFjdC5ET00uc3Bhbih7b25DbGljazogdGhpcy5vblJlbW92ZSwgY2xhc3NOYW1lOiBcImNvbW1lbnRlZF9yZW1vdmUgYnV0dG9uXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLmkoe2NsYXNzTmFtZTogXCJmYSBmYS10aW1lc1wifSlcbiAgICAgICksIFxuICAgICAgIXRoaXMucHJvcHMuaXNSZXBseSAmJiBSZWFjdC5ET00uc3Bhbih7b25DbGljazogdGhpcy5wcm9wcy5vblJlcGx5LCBjbGFzc05hbWU6IFwiY29tbWVudGVkX3JlcGx5XCJ9LCBcInJlcGx5XCIpXG4gICAgKTtcbiAgfSxcblxuICBib2R5OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLnByb3BzLmVkaXRpbmcpIHtcbiAgICAgIHJldHVybiBmb3JtYXQodGhpcy5wcm9wcy5kYXRhLnRleHQsIFwidGV4dFwiKVxuICAgIH1cbiAgICByZXR1cm4gQXV0b1RleHRhcmVhKHtcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlR5cGUgeW91ciBjb21tZW50IGhlcmVcIiwgXG4gICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZSwgXG4gICAgICB2YWx1ZTogdGhpcy5zdGF0ZS50ZXh0fSlcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29tbWVudCA9IHRoaXMucHJvcHMuZGF0YVxuICAgICAgLCBjbHMgPSBcImNvbW1lbnRlZF9jb21tZW50XCJcbiAgICBpZiAodGhpcy5wcm9wcy5lZGl0aW5nKSB7XG4gICAgICBjbHMgKz0gJyBjb21tZW50ZWRfY29tbWVudC0tZWRpdGluZydcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuY2FuRWRpdCkge1xuICAgICAgY2xzICs9ICcgY29tbWVudGVkX2NvbW1lbnQtLW1pbmUnXG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmlzUmVwbHkpIHtcbiAgICAgIGNscyArPSAnIGNvbW1lbnRlZF9jb21tZW50LS1yZXBseSdcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuaGFzUmVwbGllcykge1xuICAgICAgY2xzICs9ICcgY29tbWVudGVkX2NvbW1lbnQtLWhhcy1yZXBsaWVzJ1xuICAgIH1cblxuICAgIHZhciB2b3RlcyA9IHRoaXMuZ2V0Vm90ZXMoKVxuICAgIGlmICh2b3Rlcy5mbGFnQ291bnQgPiAyICYmIHRoaXMucHJvcHMudXNlcmlkICE9PSB0aGlzLnByb3BzLmRhdGEudXNlcmlkKSB7XG4gICAgICByZXR1cm4gUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBjbHMgKyBcIiBjb21tZW50ZWRfY29tbWVudC0tZmxhZ2dlZFwifSwgXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKHtjbGFzc05hbWU6IFwiY29tbWVudGVkX3BpYyBmYS1zdGFjayBmYS1sZ1wifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmkoe2NsYXNzTmFtZTogXCJmYSBmYS1jaXJjbGUgZmEtc3RhY2stMnhcIn0pLCBcbiAgICAgICAgICBSZWFjdC5ET00uaSh7Y2xhc3NOYW1lOiBcImZhIGZhLWZsYWcgZmEtc3RhY2stMXggZmEtaW52ZXJzZVwifSlcbiAgICAgICAgKSwgXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKHtjbGFzc05hbWU6IFwiZGlzcGxheS1uYW1lXCJ9LCBcbiAgICAgICAgICBcImZsYWdnZWQgY29tbWVudCBoaWRkZW5cIlxuICAgICAgICApXG4gICAgICApXG4gICAgfVxuXG4gICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogY2xzfSwgXG4gICAgICBSZWFjdC5ET00uaW1nKHtjbGFzc05hbWU6IFwiY29tbWVudGVkX3BpY1wiLCBzcmM6IGNvbW1lbnQucGljdHVyZX0pLCBcbiAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJyaWdodFwifSwgXG4gICAgICAgIHRoaXMuYnV0dG9ucyh2b3RlcyksIFxuICAgICAgICBSZWFjdC5ET00uc3Ryb25nKHtjbGFzc05hbWU6IFwiZGlzcGxheS1uYW1lXCJ9LCBjb21tZW50LmRpc3BsYXlOYW1lKSwgXG4gICAgICAgIGNvbW1lbnQuY3JlYXRlZCAmJiAvLyBUT0RPIGhhdmUgdGhpcyB0aW1lIGF1dG8tdXBkYXRlXG4gICAgICAgICAgUmVhY3QuRE9NLnNwYW4oe2NsYXNzTmFtZTogXCJkaXNwbGF5LXRpbWVcIn0sIG1vbWVudChjb21tZW50LmNyZWF0ZWQpLmZyb21Ob3coKSksIFxuICAgICAgICB0aGlzLnByb3BzLnBhcmVudERlbGV0ZWQgJiZcbiAgICAgICAgICBSZWFjdC5ET00uc3Bhbih7Y2xhc3NOYW1lOiBcInBhcmVudC1kZWxldGVkXCJ9LCBcImluIHJlcGx5IHRvIGEgZGVsZXRlZCBjb21tZW50XCIpLCBcbiAgICAgICAgdGhpcy5wcm9wcy5jcmVhdGluZyAmJlxuICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oe2NsYXNzTmFtZTogXCJjb21tZW50ZWRfbG9nb3V0XCIsIG9uQ2xpY2s6IHRoaXMub25Mb2dvdXR9LCBcImxvZ291dFwiKSwgXG4gICAgICAgIHRoaXMuYm9keSgpXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWVudERpc3BsYXlcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIENvbW1lbnREaXNwbGF5ID0gcmVxdWlyZSgnLi9jb21tZW50LWRpc3BsYXkuanN4JylcblxudmFyIENvbW1lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb21tZW50JyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgZGF0YTogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgIGNhbkVkaXQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHVzZXJpZDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBkYjogUmVhY3QuUHJvcFR5cGVzLm9iamVjdCxcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZWRpdGluZzogZmFsc2UsXG4gICAgICByZXBseWluZzogZmFsc2UsXG4gICAgfVxuICB9LFxuXG4gIG9uUmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wcm9wcy5kYi5yZW1vdmVDb21tZW50KHRoaXMucHJvcHMuZGF0YS5faWQpXG4gIH0sXG5cbiAgb25FZGl0OiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgICB0aGlzLnNldFN0YXRlKHtlZGl0aW5nOiB0cnVlfSlcbiAgfSxcblxuICBvblJlcGx5OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuaXNSZXBseSkgcmV0dXJuXG4gICAgdGhpcy5zZXRTdGF0ZSh7ZWRpdGluZzogZmFsc2UsIHJlcGx5aW5nOiB0cnVlfSk7XG4gIH0sXG5cbiAgb25VbkhlYXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wcm9wcy5kYi51bkhlYXJ0KHRoaXMucHJvcHMuZGF0YS5faWQsIHRoaXMucHJvcHMudXNlcmlkKVxuICB9LFxuXG4gIG9uSGVhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnByb3BzLmRiLmhlYXJ0KHRoaXMucHJvcHMuZGF0YS5faWQsIHRoaXMucHJvcHMudXNlcmlkKVxuICB9LFxuXG4gIG9uRmxhZzogZnVuY3Rpb24gKGZsYWcpIHtcbiAgICB0aGlzLnByb3BzLmRiLmZsYWcodGhpcy5wcm9wcy5kYXRhLl9pZCwgdGhpcy5wcm9wcy51c2VyaWQsIGZsYWcpXG4gIH0sXG5cbiAgY2FuY2VsRWRpdDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2VkaXRpbmc6IGZhbHNlfSlcbiAgfSxcblxuICBkb25lRWRpdGluZzogZnVuY3Rpb24gKHRleHQpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuZWRpdGluZykgcmV0dXJuXG4gICAgaWYgKCF0ZXh0KSByZXR1cm5cbiAgICB0aGlzLnByb3BzLmRiLmVkaXRDb21tZW50KHRoaXMucHJvcHMuZGF0YS5faWQsIHRleHQpXG4gICAgdGhpcy5zZXRTdGF0ZSh7ZWRpdGluZzogZmFsc2V9KVxuICB9LFxuXG4gIGRvbmVSZXBseWluZzogZnVuY3Rpb24gKHRleHQpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUucmVwbHlpbmcpIHJldHVyblxuICAgIGlmICghdGV4dCkgcmV0dXJuXG4gICAgdGhpcy5wcm9wcy5kYi5hZGRDb21tZW50KHRleHQsIFwicmVwbHk6XCIgKyB0aGlzLnByb3BzLmRhdGEuX2lkLCAnJylcbiAgICB0aGlzLnNldFN0YXRlKHtyZXBseWluZzogZmFsc2V9KVxuICB9LFxuXG4gIGNhbmNlbFJlcGx5OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7cmVwbHlpbmc6IGZhbHNlfSlcbiAgfSxcblxuICByZW5kZXJSZXBsaWVzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlcGxpZXMgPSB0aGlzLnByb3BzLnJlcGxpZXNcbiAgICBpZiAoIXJlcGxpZXMubGVuZ3RoICYmICF0aGlzLnN0YXRlLnJlcGx5aW5nKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgdmFyIHVzZXIgPSB0aGlzLnByb3BzLnVzZXJcbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImNvbW1lbnRlZF9yZXBsaWVzXCJ9LCBcblxuICAgICAgcmVwbGllcy5tYXAoZnVuY3Rpb24gKGNvbW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIENvbW1lbnQoe1xuICAgICAgICAgIGtleTogY29tbWVudC5faWQsXG4gICAgICAgICAgaXNSZXBseTogdHJ1ZSxcbiAgICAgICAgICByZXBsaWVzOiBbXSxcbiAgICAgICAgICBjYW5FZGl0OiB1c2VyICYmIHVzZXIudWlkID09IGNvbW1lbnQudXNlcmlkLFxuICAgICAgICAgIGNhblZvdGU6ICEhdXNlcixcbiAgICAgICAgICB1c2VyaWQ6IHVzZXIgJiYgdXNlci51aWQsXG4gICAgICAgICAgZGF0YTogY29tbWVudCxcbiAgICAgICAgICB1c2VyOiB1c2VyLFxuICAgICAgICAgIGRiOiB0aGlzLnByb3BzLmRiLFxuICAgICAgICB9KVxuICAgICAgfS5iaW5kKHRoaXMpKSwgXG5cbiAgICAgIHRoaXMuc3RhdGUucmVwbHlpbmcgJiYgdXNlciAmJiBDb21tZW50RGlzcGxheSh7XG4gICAgICAgIGVkaXRpbmc6IHRydWUsXG4gICAgICAgIGNhbkVkaXQ6IHRydWUsXG4gICAgICAgIGNhblZvdGU6IGZhbHNlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgcGljdHVyZTogdGhpcy5wcm9wcy51c2VyLnBpY3R1cmUsXG4gICAgICAgICAgZGlzcGxheU5hbWU6IHRoaXMucHJvcHMudXNlci5kaXNwbGF5TmFtZSxcbiAgICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICB9LFxuICAgICAgICBvbkxvZ291dDogdGhpcy5vbkxvZ291dCxcbiAgICAgICAgdXNlcmlkOiB0aGlzLnByb3BzLnVzZXJpZCxcbiAgICAgICAgaXNSZXBseTogdHJ1ZSxcbiAgICAgICAgY3JlYXRpbmc6IHRydWUsXG5cbiAgICAgICAgY2FuY2VsRWRpdDogdGhpcy5jYW5jZWxSZXBseSxcbiAgICAgICAgZG9uZUVkaXRpbmc6IHRoaXMuZG9uZVJlcGx5aW5nLFxuICAgICAgICBvblJlbW92ZTogdGhpcy5jYW5jZWxSZXBseVxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgb25Mb2dvdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtyZXBseWluZzogZmFsc2UsIGVkaXRpbmc6IGZhbHNlfSlcbiAgICB0aGlzLnByb3BzLmRiLmxvZ291dCgpXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJjb21tZW50ZWRfb25lXCJ9LCBcbiAgICAgIENvbW1lbnREaXNwbGF5KHtcbiAgICAgICAgZWRpdGluZzogdGhpcy5zdGF0ZS5lZGl0aW5nLFxuICAgICAgICBjYW5FZGl0OiB0aGlzLnByb3BzLmNhbkVkaXQsXG4gICAgICAgIGNhblZvdGU6IHRoaXMucHJvcHMuY2FuVm90ZSxcbiAgICAgICAgZGF0YTogdGhpcy5wcm9wcy5kYXRhLFxuICAgICAgICBkYjogdGhpcy5wcm9wcy5kYixcbiAgICAgICAgaXNSZXBseTogdGhpcy5wcm9wcy5pc1JlcGx5LFxuICAgICAgICBoYXNSZXBsaWVzOiAodGhpcy5wcm9wcy51c2VyaWQgJiZcbiAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUucmVwbHlpbmcpIHx8XG4gICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnJlcGxpZXMgJiZcbiAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMucmVwbGllcy5sZW5ndGgsXG4gICAgICAgIHVzZXJpZDogdGhpcy5wcm9wcy51c2VyaWQsXG4gICAgICAgIHBhcmVudERlbGV0ZWQ6IHRoaXMucHJvcHMucGFyZW50RGVsZXRlZCxcblxuICAgICAgICBvbkVkaXQ6IHRoaXMub25FZGl0LFxuICAgICAgICBvbkZsYWc6IHRoaXMub25GbGFnLFxuICAgICAgICBvblJlcGx5OiAhdGhpcy5wcm9wcy5pc1JlcGx5ICYmIHRoaXMub25SZXBseSxcbiAgICAgICAgY2FuY2VsUmVwbHk6IHRoaXMuY2FuY2VsUmVwbHksXG4gICAgICAgIG9uTG9nb3V0OiB0aGlzLm9uTG9nb3V0LFxuICAgICAgICBvblJlbW92ZTogdGhpcy5vblJlbW92ZSxcbiAgICAgICAgb25IZWFydDogdGhpcy5vbkhlYXJ0LFxuICAgICAgICBvblVuSGVhcnQ6IHRoaXMub25VbkhlYXJ0LFxuICAgICAgICBkb25lRWRpdGluZzogdGhpcy5kb25lRWRpdGluZyxcbiAgICAgICAgY2FuY2VsRWRpdDogdGhpcy5jYW5jZWxFZGl0LFxuICAgICAgfSksIFxuICAgICAgdGhpcy5yZW5kZXJSZXBsaWVzKClcbiAgICApXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbW1lbnQ7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBDb21tZW50RGlzcGxheSA9IHJlcXVpcmUoJy4vY29tbWVudC1kaXNwbGF5LmpzeCcpXG52YXIgUFQgPSBSZWFjdC5Qcm9wVHlwZXNcblxudmFyIENyZWF0ZUNvbW1lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDcmVhdGVDb21tZW50JyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgb25IaWRlOiBSZWFjdC5Qcm9wVHlwZXMub25lT2ZUeXBlKFtcbiAgICAgICAgUFQuYm9vbCwgUFQuZnVuY1xuICAgIF0pLFxuICAgIHRhcmdldDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIGRiOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgdXNlcjogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkXG4gIH0sXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0OiAnJ1xuICAgIH1cbiAgfSxcblxuICBfb25TdWJtaXQ6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgaWYgKCF0ZXh0KSByZXR1cm5cbiAgICB0aGlzLnByb3BzLmRiLmFkZENvbW1lbnQodGV4dCwgdGhpcy5wcm9wcy50YXJnZXQsIGZhbHNlKVxuICAgIHRoaXMucHJvcHMub25IaWRlICYmIHRoaXMucHJvcHMub25IaWRlKClcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQ29tbWVudERpc3BsYXkoe1xuICAgICAgY2FuRWRpdDogdHJ1ZSxcbiAgICAgIGVkaXRpbmc6IHRydWUsXG4gICAgICBjcmVhdGluZzogdHJ1ZSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgcGljdHVyZTogdGhpcy5wcm9wcy51c2VyLnBpY3R1cmUsXG4gICAgICAgIGRpc3BsYXlOYW1lOiB0aGlzLnByb3BzLnVzZXIuZGlzcGxheU5hbWUsXG4gICAgICAgIHRleHQ6ICcnLFxuICAgICAgfSxcbiAgICAgIHVzZXJpZDogdGhpcy5wcm9wcy51c2VyLnVpZCxcblxuICAgICAgb25Mb2dvdXQ6IHRoaXMucHJvcHMuZGIubG9nb3V0LmJpbmQodGhpcy5wcm9wcy5kYiksXG4gICAgICBjYW5jZWxFZGl0OiB0aGlzLnByb3BzLm9uSGlkZSxcbiAgICAgIGRvbmVFZGl0aW5nOiB0aGlzLl9vblN1Ym1pdCxcbiAgICAgIG9uUmVtb3ZlOiB0aGlzLnByb3BzLm9uSGlkZVxuICAgIH0pXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENyZWF0ZUNvbW1lbnRcblxuIixudWxsLG51bGwsbnVsbCxudWxsLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBQVCA9IFJlYWN0LlByb3BUeXBlc1xuICAsIG1peGluZyA9IHJlcXVpcmUoJy4vbWl4aW4nKVxuICAsIFZpZXdDb21tZW50cyA9IHJlcXVpcmUoJy4vdmlldy1jb21tZW50cy5qc3gnKVxuICAsIGN4ID0gUmVhY3QuYWRkb25zLmNsYXNzU2V0XG5cbmZ1bmN0aW9uIGlzRGVzY2VuZGVudChjaGlsZCwgcGFyZW50KSB7XG4gIHdoaWxlIChjaGlsZCkge1xuICAgIGlmIChjaGlsZCA9PT0gcGFyZW50KSByZXR1cm4gdHJ1ZVxuICAgIGNoaWxkID0gY2hpbGQucGFyZW50Tm9kZVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxudmFyIElubGluZUNvbW1lbnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSW5saW5lQ29tbWVudHMnLFxuICBtaXhpbnM6IFttaXhpbmddLFxuICBwcm9wVHlwZXM6IHtcbiAgICB0YXJnZXQ6IFBULnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIGJvZHk6IFBULm9iamVjdC5pc1JlcXVpcmVkLFxuICAgIGF1dGg6IFBULmFycmF5LmlzUmVxdWlyZWQsXG4gICAgZGI6IFBULm9iamVjdC5pc1JlcXVpcmVkLFxuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmRvY01vdXNlRG93bik7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuZG9jTW91c2VEb3duKTtcbiAgfSxcblxuICBkb2NNb3VzZURvd246IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLnNob3dpbmcpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB2YXIgaXNDb21tZW50ID0gZmFsc2VcbiAgICAgICwgbm9kZSA9IGUudGFyZ2V0XG4gICAgICAsIG1lID0gdGhpcy5nZXRET01Ob2RlKClcbiAgICBpZiAobm9kZS5jbGFzc0xpc3QuY29udGFpbnMoJ2FkZC1jb21tZW50JykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgaWYgKG5vZGUgPT09IG1lKSByZXR1cm5cbiAgICAgIGlmIChub2RlLmNsYXNzTGlzdCkge1xuICAgICAgICBpZiAobm9kZS5jbGFzc0xpc3QuY29udGFpbnMoJ2NvbW1lbnRlZF9sb2dpbi10eXBlJykpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5jbGFzc0xpc3QuY29udGFpbnMoJ2NvbW1lbnRlZF9pbmxpbmUnKSkge1xuICAgICAgICAgIGlzQ29tbWVudCA9IHRydWVcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFub2RlLnBhcmVudE5vZGUgJiYgbm9kZSAhPT0gZG9jdW1lbnQpIHtcbiAgICAgICAgLy8gbm9kZSBkaXNhcHBlYXJlZFxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG4gICAgfVxuICAgIGlmICghaXNDb21tZW50KSB7XG4gICAgICB0aGlzLnByb3BzLmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnY29tbWVudGVkX2lubGluZS1ib2R5LS1zaGlmdGVkJylcbiAgICB9XG4gICAgdGhpcy5zZXRTdGF0ZSh7c2hvd2luZzogZmFsc2V9KVxuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLnNob3dpbmcpIHtcbiAgICAgIHRoaXMucHJvcHMuYm9keS5jbGFzc0xpc3QuYWRkKCdjb21tZW50ZWRfaW5saW5lLWJvZHktLXNoaWZ0ZWQnKVxuICAgIH1cbiAgfSxcblxuICBvblNob3c6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5zaG93aW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5vbkhpZGUoKVxuICAgIH1cbiAgICB0aGlzLnNldFN0YXRlKHtzaG93aW5nOiB0cnVlfSk7XG4gIH0sXG5cbiAgb25IaWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wcm9wcy5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2NvbW1lbnRlZF9pbmxpbmUtYm9keS0tc2hpZnRlZCcpXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2hvd2luZzogZmFsc2V9KTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29tbWVudHMgPSB0aGlzLm9yZ2FuaXplQ29tbWVudHMoKTtcbiAgICB2YXIgaGFzQ29tbWVudHMgPSBjb21tZW50cyAmJiBjb21tZW50cy5saXN0Lmxlbmd0aFxuICAgIHZhciBjb3VudCA9IDA7XG4gICAgY29tbWVudHMgPyBjb21tZW50cy5saXN0LmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIGNvdW50ICs9IDEgKyBpdGVtLnJlcGxpZXMubGVuZ3RoXG4gICAgfSkgOiBudWxsO1xuICAgIHJldHVybiBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IGN4KHtcbiAgICAgIFwiY29tbWVudGVkX2lubGluZVwiOiB0cnVlLFxuICAgICAgJ2NvbW1lbnRlZF9pbmxpbmUtLWVtcHR5JzogIWhhc0NvbW1lbnRzLFxuICAgICAgJ2NvbW1lbnRlZF9pbmxpbmUtLXNob3dpbmcnOiB0aGlzLnN0YXRlLnNob3dpbmdcbiAgICB9KX0sIFxuICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImNvbW1lbnRlZF9pbmxpbmVfZmxhZ1wiLCBvbkNsaWNrOiB0aGlzLm9uU2hvd30sIFxuICAgICAgICBjb3VudCB8fCAnKydcbiAgICAgICksIFxuICAgICAgdGhpcy5zdGF0ZS5zaG93aW5nICYmIFZpZXdDb21tZW50cyh7XG4gICAgICAgIGNvbW1lbnRzOiBjb21tZW50cyxcbiAgICAgICAgZGI6IHRoaXMucHJvcHMuZGIsXG4gICAgICAgIHVzZXI6IHRoaXMuc3RhdGUudXNlcixcbiAgICAgICAgbG9hZGluZzogdGhpcy5zdGF0ZS5sb2FkaW5nLFxuICAgICAgICBhdXRoOiB0aGlzLnByb3BzLmF1dGgsXG4gICAgICAgIHRhcmdldDogdGhpcy5wcm9wcy50YXJnZXQsXG4gICAgICAgIHN0YXJ0QWRkaW5nOiAhaGFzQ29tbWVudHMsXG4gICAgICB9KVxuICAgICk7XG4gIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5saW5lQ29tbWVudHM7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBJQ09OUyA9IHtcbiAgZmFjZWJvb2s6ICdmYWNlYm9vaycsXG4gIHR3aXR0ZXI6ICd0d2l0dGVyJyxcbiAgZ29vZ2xlOiAnZ29vZ2xlJyxcbiAgZ2l0aHViOiAnZ2l0aHViJ1xufVxuXG52YXIgTG9naW4gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdMb2dpbicsXG4gIHByb3BUeXBlczoge1xuICAgIGRiOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgYXV0aDogUmVhY3QuUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXG4gICAgb25Mb2dpbjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBvbkNhbmNlbDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBsb2FkaW5nOiBmYWxzZVxuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucHJvcHMuZGIub25Mb2dpbih0aGlzLl9vbkxvZ2luKVxuICB9LFxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucHJvcHMuZGIub2ZmTG9naW4odGhpcy5fb25Mb2dpbilcbiAgfSxcblxuICBfb25Mb2dpbjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2xvYWRpbmc6IGZhbHNlfSlcbiAgfSxcblxuICBvbkNsaWNrOiBmdW5jdGlvbiAodHlwZSkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2xvYWRpbmc6IHR5cGV9KVxuICAgIHRoaXMucHJvcHMuZGIubG9naW4odHlwZSlcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5sb2FkaW5nKSB7XG4gICAgICByZXR1cm4gUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImNvbW1lbnRlZF9sb2dpbi0tbG9hZGluZyBjb21tZW50ZWRfbG9naW5cIn0sIFxuICAgICAgICBcIkNvbm5lY3RpbmcgdG8gXCIsIHRoaXMuc3RhdGUubG9hZGluZywgXG4gICAgICAgIFJlYWN0LkRPTS5pKHtjbGFzc05hbWU6IFwiZmEgZmEtc3BpbiBmYS1zcGlubmVyXCJ9KVxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiY29tbWVudGVkX2xvZ2luXCJ9LCBcbiAgICAgIHRoaXMucHJvcHMuYXV0aC5tYXAoZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgdmFyIGljb24gPSBJQ09OU1t0eXBlXVxuICAgICAgICAgICwgY2xzID0gXCJjb21tZW50ZWRfbG9naW4tdHlwZVwiXG4gICAgICAgIGNscyArPSAnIGNvbW1lbnRlZF9sb2dpbi10eXBlLS0nICsgdHlwZVxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmJ1dHRvbih7a2V5OiB0eXBlLCBjbGFzc05hbWU6IGNscywgb25DbGljazogdGhpcy5vbkNsaWNrLmJpbmQodGhpcywgdHlwZSl9LCBcbiAgICAgICAgICBSZWFjdC5ET00uc3Bhbih7Y2xhc3NOYW1lOiBcImNvbW1lbnRlZF9waWMgZmEtc3RhY2sgZmEtbGdcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmkoe2NsYXNzTmFtZTogXCJmYSBmYS1jaXJjbGUgZmEtc3RhY2stMnhcIn0pLCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pKHtjbGFzc05hbWU6IFwiZmEgZmEtXCIgKyBpY29uICsgXCIgZmEtc3RhY2stMXggZmEtaW52ZXJzZVwifSlcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9LmJpbmQodGhpcykpLCBcbiAgICAgIHRoaXMucHJvcHMub25DYW5jZWwgJiYgUmVhY3QuRE9NLmJ1dHRvbih7Y2xhc3NOYW1lOiBcImNvbW1lbnRlZF9sb2dpbi10eXBlIGNvbW1lbnRlX2xvZ2luLXR5cGUtLWNhbmNlbFwiLCBcbiAgICAgICAgICBvbkNsaWNrOiB0aGlzLnByb3BzLm9uQ2FuY2VsfSwgXCLDl1wiXG4gICAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMb2dpblxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgVmlld0NvbW1lbnRzID0gcmVxdWlyZSgnLi92aWV3LWNvbW1lbnRzLmpzeCcpXG4gICwgbWl4aW5nID0gcmVxdWlyZSgnLi9taXhpbicpXG5cbnZhciBNYWluQ29tbWVudHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdNYWluQ29tbWVudHMnLFxuICBtaXhpbnM6IFttaXhpbmddLFxuICBwcm9wVHlwZXM6IHtcbiAgICBkYjogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgIGF1dGg6IFJlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRhcmdldDogJ21haW4nXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBWaWV3Q29tbWVudHMoe1xuICAgICAgY29tbWVudHM6IHRoaXMub3JnYW5pemVDb21tZW50cygpLFxuICAgICAgbG9hZGluZzogdGhpcy5zdGF0ZS5sb2FkaW5nLFxuICAgICAgdXNlcjogdGhpcy5zdGF0ZS51c2VyLFxuICAgICAgZGI6IHRoaXMucHJvcHMuZGIsXG4gICAgICBhdXRoOiB0aGlzLnByb3BzLmF1dGgsXG4gICAgICB0YXJnZXQ6ICdtYWluJ1xuICAgIH0pO1xuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTWFpbkNvbW1lbnRzO1xuIixudWxsLG51bGwsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIExvZ2luID0gcmVxdWlyZSgnLi9sb2dpbi5qc3gnKVxuXG52YXIgUmVwbHlMb2dpbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JlcGx5TG9naW4nLFxuICBwcm9wVHlwZXM6IHtcbiAgICBkYjogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgIGF1dGg6IFJlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxuICAgIG9uQ2FuY2VsOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBvblJlcGx5OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb3BlbjogZmFsc2VcbiAgICB9XG4gIH0sXG4gIG9uT3BlbjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucHJvcHMub25SZXBseSgpXG4gICAgdGhpcy5zZXRTdGF0ZSh7b3BlbjogdHJ1ZX0pXG4gIH0sXG4gIG9uQ2FuY2VsOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wcm9wcy5vbkNhbmNlbCgpXG4gICAgdGhpcy5zZXRTdGF0ZSh7b3BlbjogZmFsc2V9KVxuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gUmVhY3QuRE9NLnNwYW4oe2NsYXNzTmFtZTogXCJjb21tZW50ZWRfcmVwbHktbG9naW5cIn0sIFxuICAgICAgdGhpcy5zdGF0ZS5vcGVuID9cbiAgICAgICAgTG9naW4oe1xuICAgICAgICAgIGRiOiB0aGlzLnByb3BzLmRiLCBcbiAgICAgICAgICBhdXRoOiB0aGlzLnByb3BzLmF1dGgsIFxuICAgICAgICAgIG9uTG9naW46IHRoaXMucHJvcHMub25SZXBseSwgXG4gICAgICAgICAgb25DYW5jZWw6IHRoaXMub25DYW5jZWx9XG4gICAgICAgICkgOlxuICAgICAgICBSZWFjdC5ET00uc3Bhbih7b25DbGljazogdGhpcy5vbk9wZW4sIGNsYXNzTmFtZTogXCJjb21tZW50ZWRfcmVwbHlcIn0sIFwicmVwbHlcIilcbiAgICAgIFxuICAgIClcbiAgfSxcbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gUmVwbHlMb2dpblxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgU2hvd0FsbGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU2hvd0FsbGVyJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgc2tpcHBlZDogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2hvdyA9IHRoaXMucHJvcHMuc2hvd0FsbFxuICAgIHJldHVybiBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiY29tbWVudGVkX3Nob3ctYWxsZXJcIn0sIFxuICAgICAgUmVhY3QuRE9NLmJ1dHRvbih7XG4gICAgICAgICAgY2xhc3NOYW1lOiBcImNvbW1lbnRlZF9zaG93LWFsbGVyX2J0blwiLCBcbiAgICAgICAgICBvbkNsaWNrOiB0aGlzLnByb3BzLm9uQ2hhbmdlLmJpbmQobnVsbCwgIXNob3cpfSwgXG4gICAgICAgIHNob3cgPyAnSGlkZScgOiAnU2hvdycsIFwiIFwiLCB0aGlzLnByb3BzLmNvdW50LCBcIiBzaWRlIGNvbW1lbnRzXCJcbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaG93QWxsZXJcblxuIixudWxsLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBtaXhpbmcgPSByZXF1aXJlKCcuL21peGluJylcbiAgLCBDb21tZW50ID0gcmVxdWlyZSgnLi9jb21tZW50LmpzeCcpXG4gICwgU2hvd0FsbGVyID0gcmVxdWlyZSgnLi9zaG93LWFsbGVyLmpzeCcpXG4gICwgQWRkQ29tbWVudCA9IHJlcXVpcmUoJy4vYWRkLWNvbW1lbnQuanN4JylcblxudmFyIFZpZXdDb21tZW50cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1ZpZXdDb21tZW50cycsXG4gIHByb3BUeXBlczoge1xuICAgIGNvbW1lbnRzOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxuICAgIGRiOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgYXV0aDogUmVhY3QuUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXG4gICAgdGFyZ2V0OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgc3RhcnRBZGRpbmc6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzaG93QWxsOiBmYWxzZSxcbiAgICB9XG4gIH0sXG5cbiAgX29uQ2hhbmdlU2hvdzogZnVuY3Rpb24gKHdoaWNoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzaG93QWxsOiB3aGljaFxuICAgIH0pXG4gIH0sXG5cbiAgcmVuZGVyQ29tbWVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMucHJvcHMuY29tbWVudHMpIHtcbiAgICAgIGlmICh0aGlzLnByb3BzLmxvYWRpbmcpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5zcGFuKG51bGwsIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmkoe2NsYXNzTmFtZTogXCJmYSBmYS1zcGluIGZhLXNwaW5uZXJcIn0pLCBcbiAgICAgICAgICAgICcgJywgXCJMb2FkaW5nLi4uXCJcbiAgICAgICAgKVxuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICB2YXIgb3JnYW5pemVkID0gdGhpcy5wcm9wcy5jb21tZW50c1xuICAgIHZhciB1c2VyID0gdGhpcy5wcm9wcy51c2VyXG4gICAgdmFyIGRiID0gdGhpcy5wcm9wcy5kYlxuICAgIHZhciBpc01haW4gPSB0aGlzLnByb3BzLnRhcmdldCA9PT0gJ21haW4nXG5cbiAgICB2YXIgY29tbWVudHMgPSBvcmdhbml6ZWQubGlzdC5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBDb21tZW50KHtcbiAgICAgICAga2V5OiBpdGVtLmNvbW1lbnQuX2lkLFxuICAgICAgICByZXBsaWVzOiBpdGVtLnJlcGxpZXMsXG4gICAgICAgIHBhcmVudERlbGV0ZWQ6IGl0ZW0ucGFyZW50RGVsZXRlZCxcbiAgICAgICAgY2FuRWRpdDogdXNlciAmJiB1c2VyLnVpZCA9PSBpdGVtLmNvbW1lbnQudXNlcmlkLFxuICAgICAgICBjYW5Wb3RlOiAhIXVzZXIsXG4gICAgICAgIHVzZXJpZDogdXNlciAmJiB1c2VyLnVpZCxcbiAgICAgICAgZGF0YTogaXRlbS5jb21tZW50LFxuICAgICAgICB1c2VyOiB1c2VyLFxuICAgICAgICBkYjogZGIsXG4gICAgICB9KVxuICAgIH0uYmluZCh0aGlzKSlcblxuICAgIHJldHVybiBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiY29tbWVudGVkX2NvbW1lbnRzXCJ9LCBcbiAgICAgIChpc01haW4gJiYgb3JnYW5pemVkLmlubGluZXMpID8gU2hvd0FsbGVyKHtcbiAgICAgICAgY291bnQ6IG9yZ2FuaXplZC5pbmxpbmVzLFxuICAgICAgICBzaG93QWxsOiB0aGlzLnN0YXRlLnNob3dBbGwsXG4gICAgICAgIG9uQ2hhbmdlOiB0aGlzLl9vbkNoYW5nZVNob3dcbiAgICAgIH0pIDogZmFsc2UsIFxuICAgICAgY29tbWVudHNcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiY29tbWVudGVkX21haW5cIn0sIFxuICAgICAgdGhpcy5yZW5kZXJDb21tZW50cygpLCBcbiAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJjb21tZW50ZWRfYWRkXCJ9LCBcbiAgICAgICAgQWRkQ29tbWVudCh7XG4gICAgICAgICAgYXV0b0FkZDogdGhpcy5wcm9wcy5zdGFydEFkZGluZywgXG4gICAgICAgICAgbm9DYW5jZWw6IHRoaXMucHJvcHMuc3RhcnRBZGRpbmcsIFxuICAgICAgICAgIHRhcmdldDogdGhpcy5wcm9wcy50YXJnZXQsIFxuICAgICAgICAgIHVzZXI6IHRoaXMucHJvcHMudXNlciwgXG4gICAgICAgICAgYXV0aDogdGhpcy5wcm9wcy5hdXRoLCBcbiAgICAgICAgICBkYjogdGhpcy5wcm9wcy5kYn0pXG4gICAgICApLCBcbiAgICAgIHRoaXMucHJvcHMudGFyZ2V0ID09PSAnbWFpbicgJiZcbiAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImNvbW1lbnRlZF9hdHRyaWJ1dGlvblwifSwgXG4gICAgICAgICAgXCJDb21tZW50cyBwb3dlcmVkIGJ5IFwiLCBSZWFjdC5ET00uYSh7dGFyZ2V0OiBcIl9ibGFua1wiLCBocmVmOiBcImh0dHA6Ly9jb21tZW50ZWQuZ2l0aHViLmlvXCJ9LCBcIi8vY29tbWVudGVkXCIpXG4gICAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3Q29tbWVudHM7XG4iXX0=
