import { useState, useEffect, useCallback } from 'react';
import './App.css';

// Constants
const CATEGORY_ICONS = {
  Road: "🛣️",
  Sanitation: "🗑️",
  Water: "🚰",
  Electricity: "💡",
  'Green Space': "🌳",
  'Public Toilet': "🚽",
  Other: "❓"
};

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved", "Rejected"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "most-voted", label: "Most Votes" },
  { value: "least-voted", label: "Least Votes" }
];

const ADMIN_ROLES = {
  CITY_OFFICIAL: "city_official",
  SANITATION_DEPARTMENT: "sanitation_department",
  PARKS_DEPARTMENT: "parks_department",
  URBAN_DEVELOPMENT: "urban_development"
};

const ADMIN_ADDRESSES = [
  "0x1234567890123456789012345678901234567890",
  "0x0987654321098765432109876543210987654321"
];

const DEPARTMENTS = [
  "Transport",
  "Sanitation",
  "Water",
  "Power",
  "Parks",
  "Urban Development"
];

const DEFAULT_ISSUES = [
  {
    id: 1,
    title: "Pothole on Main Road",
    description: "Large pothole near the intersection causing traffic issues",
    category: "Road",
    location: "Connaught Place, Delhi",
    image: "https://images.unsplash.com/photo-1563555397763-5fc103c6f7b8?w=500&auto=format&fit=crop",
    status: "Pending",
    votes: 4,
    userAddress: "0x1234567890123456789012345678901234567890",
    assignedDepartment: "Transport",
    comments: [
      { id: 1, user: "Resident1", text: "This has been here for weeks!" },
      { id: 2, user: "Driver123", text: "Damaged my car's suspension" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Garbage Pileup in Park",
    description: "Garbage hasn't been collected for over a week in the local park",
    category: "Sanitation",
    location: "Lodhi Gardens, Delhi",
    image: "https://images.unsplash.com/photo-1575408264798-b50b252663e6?w=500&auto=format&fit=crop",
    status: "In Progress",
    votes: 12,
    userAddress: "0x0987654321098765432109876543210987654321",
    assignedDepartment: "Sanitation",
    comments: [],
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  }
];

const DEFAULT_ADMIN_STATE = {
  adminRole: ADMIN_ROLES.CITY_OFFICIAL,
  adminView: 'issues',
  departmentFilter: 'All',
  statusFilter: 'All',
  selectedAction: null,
  selectedIssue: null,
  actionFormData: {
    newStatus: "",
    rejectionReason: "",
    departmentAssignment: ""
  }
};

const DEFAULT_USER_STATE = {
  newIssue: {
    title: "",
    description: "",
    category: "Road",
    location: "",
    image: ""
  },
  activeTab: "all",
  showForm: false,
  isSubmitting: false,
  searchTerm: "",
  filterCategory: "All",
  sortBy: "newest",
  selectedIssue: null
};

const DEFAULT_STATE = {
  issues: DEFAULT_ISSUES,
  currentAccount: null,
  isWalletConnecting: false,
  isAdmin: false,
  notification: null,
  showStats: false,
  darkMode: false,
  showMap: false,
  showUserProfile: false,
  userProfile: {
    displayName: "Anonymous",
    notificationsEnabled: true,
    bio: ""
  },
  admin: DEFAULT_ADMIN_STATE,
  user: DEFAULT_USER_STATE
};

// Utility Functions
const validateImageFile = (file) => {
  if (!file) return { valid: false, error: "No file selected" };
  if (file.size > 2 * 1024 * 1024) return { valid: false, error: "File size should not exceed 2MB" };
  if (!file.type.match('image.*')) return { valid: false, error: "Only image files are allowed" };
  return { valid: true };
};

const shortenAddress = (addr) => {
  if (!addr) return '';
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

// Component Definitions
const WalletConnectScreen = ({ connectWallet, isWalletConnecting }) => (
  <div className="wallet-connect-screen">
    <div className="welcome-card">
      <h2>Welcome to FixDelhi</h2>
      <p>Connect your wallet to report civic issues and help improve our city</p>
      <button 
        onClick={connectWallet} 
        disabled={isWalletConnecting}
        aria-label="Connect wallet"
        className="connect-wallet-btn"
      >
        {isWalletConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📢</div>
          <h3>Report Issues</h3>
          <p>Document problems in your neighborhood</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👍</div>
          <h3>Vote on Issues</h3>
          <p>Support important community concerns</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👀</div>
          <h3>Track Progress</h3>
          <p>See how reported issues are being resolved</p>
        </div>
      </div>
    </div>
  </div>
);

const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;
  
  return (
    <div className={`notification ${notification.type}`}>
      <div className="notification-content">
        {notification.message}
        <button onClick={onClose} className="notification-close" aria-label="Close notification">
          &times;
        </button>
      </div>
    </div>
  );
};

const Header = ({ 
  currentAccount, 
  darkMode, 
  showUserProfile, 
  updateState, 
  disconnectWallet,
  isAdmin,
  toggleViewMode
}) => {
  return (
    <header className={`app-header ${darkMode ? 'dark' : ''}`}>
      <div className="header-brand">
        <h1>FixDelhi</h1>
        {isAdmin && <span className="admin-badge">Admin</span>}
      </div>
      <div className="header-actions">
        {currentAccount && (
          <>
            <button 
              className="wallet-btn"
              onClick={() => updateState({ showUserProfile: !showUserProfile })}
              aria-label="User profile"
            >
              <span className="wallet-address">{shortenAddress(currentAccount)}</span>
              <span className="profile-icon">👤</span>
            </button>
            
            {isAdmin && (
              <button 
                className="view-toggle-btn"
                onClick={toggleViewMode}
                aria-label="Toggle view mode"
              >
                Switch to User View
              </button>
            )}
          </>
        )}
        <button 
          className="theme-toggle"
          onClick={() => updateState({ darkMode: !darkMode })}
          aria-label={`Toggle ${darkMode ? 'light' : 'dark'} mode`}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        {currentAccount && (
          <button 
            className="disconnect-btn"
            onClick={disconnectWallet} 
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        )}
      </div>
    </header>
  );
};

const UserProfile = ({ 
  currentAccount, 
  userProfile, 
  updateState,
  showUserProfile
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateState(prev => ({
      userProfile: {
        ...prev.userProfile,
        [name]: value
      }
    }));
  };

  const toggleNotifications = () => {
    updateState(prev => ({
      userProfile: {
        ...prev.userProfile,
        notificationsEnabled: !prev.userProfile.notificationsEnabled
      }
    }));
  };

  if (!showUserProfile) return null;

  return (
    <div className="user-profile-modal active">
      <div className="profile-overlay" onClick={() => updateState({ showUserProfile: false })}></div>
      <div className="profile-content">
        <div className="profile-header">
          <h2>User Profile</h2>
          <button 
            onClick={() => updateState({ showUserProfile: false })}
            className="close-btn"
            aria-label="Close profile"
          >
            &times;
          </button>
        </div>
        
        <div className="profile-section">
          <h3>Account Information</h3>
          <div className="wallet-info">
            <div className="wallet-icon">👛</div>
            <div>
              <p className="wallet-label">Wallet Address</p>
              <p className="wallet-address">{shortenAddress(currentAccount)}</p>
            </div>
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Profile Settings</h3>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={userProfile.displayName}
              onChange={handleInputChange}
              placeholder="Enter your display name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={userProfile.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              rows="3"
            />
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Notification Preferences</h3>
          <div className="toggle-group">
            <span>Email Notifications</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={userProfile.notificationsEnabled}
                onChange={toggleNotifications}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        
        <div className="profile-actions">
          <button 
            className="save-btn"
            onClick={() => updateState({ showUserProfile: false })}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const IssueForm = ({ 
  newIssue, 
  handleInputChange, 
  handleFileChange, 
  handleSubmit, 
  isSubmitting,
  CATEGORY_ICONS 
}) => {
  const [imagePreview, setImagePreview] = useState('');

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
    handleFileChange(e);
  };

  return (
    <form onSubmit={handleSubmit} className="issue-form">
      <h3>Report New Issue</h3>
      <div className="form-group">
        <label htmlFor="title">Title*</label>
        <input
          type="text"
          id="title"
          name="title"
          value={newIssue.title}
          onChange={handleInputChange}
          required
          aria-required="true"
          placeholder="Briefly describe the issue"
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description*</label>
        <textarea
          id="description"
          name="description"
          value={newIssue.description}
          onChange={handleInputChange}
          required
          aria-required="true"
          placeholder="Provide detailed information about the issue"
          rows="4"
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Category*</label>
          <select
            id="category"
            name="category"
            value={newIssue.category}
            onChange={handleInputChange}
          >
            {Object.keys(CATEGORY_ICONS).map((category) => (
              <option key={category} value={category}>
                {category} {CATEGORY_ICONS[category]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="location">Location*</label>
          <input
            type="text"
            id="location"
            name="location"
            value={newIssue.location}
            onChange={handleInputChange}
            required
            aria-required="true"
            placeholder="Where is the issue located?"
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="image">Image (Optional)</label>
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Issue preview" />
            <button 
              type="button" 
              className="remove-image-btn"
              onClick={() => {
                setImagePreview('');
                handleInputChange({ target: { name: 'image', value: '' } });
              }}
            >
              Remove
            </button>
          </div>
        )}
        <div className="file-upload">
          <label htmlFor="image-upload" className="upload-btn">
            {imagePreview ? 'Change Image' : 'Upload Image'}
          </label>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={onFileChange}
            aria-label="Upload issue image"
          />
        </div>
        <p className="file-hint">Max 2MB, JPG/PNG recommended</p>
      </div>
      <button 
        type="submit" 
        className="submit-btn"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="spinner"></span> Submitting...
          </>
        ) : (
          'Submit Issue'
        )}
      </button>
    </form>
  );
};

const IssueCard = ({ 
  issue, 
  upvoteIssue, 
  currentAccount,
  CATEGORY_ICONS,
  onViewDetails,
  isUpvoted
}) => {
  const statusClass = issue.status.toLowerCase().replace(' ', '-');

  return (
    <div className={`issue-card status-${statusClass}`}>
      <div className="issue-image" onClick={() => onViewDetails(issue)}>
        <img src={issue.image} alt={issue.title} />
        <div className="image-overlay">View Details</div>
      </div>
      <div className="issue-content">
        <div className="issue-header">
          <h3 onClick={() => onViewDetails(issue)}>{issue.title}</h3>
          <span className="issue-category">
            {CATEGORY_ICONS[issue.category]} {issue.category}
          </span>
        </div>
        <p className="issue-description">{issue.description}</p>
        <div className="issue-meta">
          <span className="issue-location">📍 {issue.location}</span>
          <span className={`issue-status ${statusClass}`}>{issue.status}</span>
        </div>
        <div className="issue-footer">
          <div className="vote-section">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                upvoteIssue(issue.id);
              }}
              disabled={!currentAccount}
              className={`upvote-btn ${isUpvoted ? 'upvoted' : ''}`}
              aria-label={`Upvote ${issue.title}`}
            >
              <span className="thumbs-up">👍</span> 
              <span className="vote-count">{issue.votes}</span>
            </button>
          </div>
          <div className="action-section">
            <button 
              className="details-btn"
              onClick={() => onViewDetails(issue)}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const IssueModal = ({ 
  issue, 
  onClose, 
  upvoteIssue, 
  currentAccount, 
  CATEGORY_ICONS,
  isUpvoted,
  addComment
}) => {
  const [commentText, setCommentText] = useState('');

  if (!issue) return null;

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      addComment(issue.id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="issue-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        
        <div className="modal-header">
          <h2>{issue.title}</h2>
          <div className="modal-meta">
            <span className="category-badge">
              {CATEGORY_ICONS[issue.category]} {issue.category}
            </span>
            <span className={`status-badge status-${issue.status.toLowerCase().replace(' ', '-')}`}>
              {issue.status}
            </span>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="modal-image">
            <img src={issue.image} alt={issue.title} />
          </div>
          
          <div className="modal-details">
            <div className="detail-section">
              <h3>Description</h3>
              <p>{issue.description}</p>
            </div>
            
            <div className="detail-section">
              <h3>Location</h3>
              <p>📍 {issue.location}</p>
            </div>
            
            <div className="detail-section">
              <h3>Reported On</h3>
              <p>{new Date(issue.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            
            {issue.assignedDepartment && (
              <div className="detail-section">
                <h3>Assigned Department</h3>
                <p>{issue.assignedDepartment}</p>
              </div>
            )}
          </div>
          
          <div className="modal-comments">
            <h3>Comments ({issue.comments.length})</h3>
            {issue.comments.length > 0 ? (
              <div className="comments-list">
                {issue.comments.map(comment => (
                  <div key={comment.id} className="comment">
                    <div className="comment-header">
                      <span className="comment-user">{comment.user}</span>
                      <span className="comment-time">
                        {new Date(comment.createdAt || issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="comment-text">{comment.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-comments">No comments yet</p>
            )}
            
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea 
                placeholder="Add your comment..." 
                rows="3"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              ></textarea>
              <button type="submit" className="submit-comment">
                Post Comment
              </button>
            </form>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={() => upvoteIssue(issue.id)}
            disabled={!currentAccount}
            className={`upvote-btn ${isUpvoted ? 'upvoted' : ''}`}
          >
            👍 Upvote ({issue.votes})
          </button>
          <button className="close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const MainContent = ({ 
  state, 
  updateState, 
  getFilteredAndSortedIssues, 
  upvoteIssue,
  CATEGORY_ICONS,
  currentAccount
}) => {
  const {
    activeTab,
    showForm,
    newIssue,
    isSubmitting,
    searchTerm,
    filterCategory,
    sortBy,
    selectedIssue
  } = state.user;

  const filteredIssues = getFilteredAndSortedIssues();
  const [upvotedIssues, setUpvotedIssues] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateState(prev => ({
      user: {
        ...prev.user,
        newIssue: { ...prev.user.newIssue, [name]: value }
      }
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const validation = validateImageFile(file);
    
    if (!validation.valid) {
      updateState({ notification: { message: validation.error, type: "error" } });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      updateState(prev => ({
        user: {
          ...prev.user,
          newIssue: { ...prev.user.newIssue, image: event.target.result }
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateState(prev => ({
      user: { ...prev.user, isSubmitting: true }
    }));
    
    const issue = {
      ...newIssue,
      id: Date.now(),
      status: "Pending",
      votes: 0,
      userAddress: currentAccount,
      comments: [],
      image: newIssue.image || "https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=500&auto=format&fit=crop",
      createdAt: new Date().toISOString()
    };
    
    updateState(prev => ({
      issues: [...prev.issues, issue],
      user: {
        ...prev.user,
        newIssue: DEFAULT_USER_STATE.newIssue,
        showForm: false,
        isSubmitting: false
      },
      notification: { message: "Issue reported successfully!", type: "success" }
    }));
  };

  const viewIssueDetails = (issue) => {
    updateState(prev => ({
      user: { ...prev.user, selectedIssue: issue }
    }));
  };

  const closeIssueDetails = () => {
    updateState(prev => ({
      user: { ...prev.user, selectedIssue: null }
    }));
  };

  const handleUpvote = (issueId) => {
    if (!currentAccount) return;
    
    if (upvotedIssues.includes(issueId)) {
      updateState({
        notification: { message: "You've already upvoted this issue", type: "warning" }
      });
      return;
    }

    setUpvotedIssues([...upvotedIssues, issueId]);
    upvoteIssue(issueId);
  };

  const addComment = (issueId, text) => {
    updateState(prev => ({
      issues: prev.issues.map(issue => 
        issue.id === issueId 
          ? {
              ...issue,
              comments: [
                ...issue.comments,
                {
                  id: Date.now(),
                  user: prev.userProfile.displayName,
                  text,
                  createdAt: new Date().toISOString()
                }
              ]
            }
          : issue
      )
    }));
  };

  return (
    <main className="main-content">
      <div className="content-controls">
        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "all"}
            className={activeTab === "all" ? "active" : ""}
            onClick={() => updateState(prev => ({
              user: { ...prev.user, activeTab: "all" }
            }))}
          >
            All Issues
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "my"}
            className={activeTab === "my" ? "active" : ""}
            onClick={() => updateState(prev => ({
              user: { ...prev.user, activeTab: "my" }
            }))}
            disabled={!currentAccount}
          >
            My Reports
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "pending"}
            className={activeTab === "pending" ? "active" : ""}
            onClick={() => updateState(prev => ({
              user: { ...prev.user, activeTab: "pending" }
            }))}
          >
            Pending
          </button>
        </div>

        <div className="filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => updateState(prev => ({
                user: { ...prev.user, searchTerm: e.target.value }
              }))}
              aria-label="Search issues"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => updateState(prev => ({
              user: { ...prev.user, filterCategory: e.target.value }
            }))}
            aria-label="Filter by category"
            className="filter-select"
          >
            <option value="All">All Categories</option>
            {Object.keys(CATEGORY_ICONS).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => updateState(prev => ({
              user: { ...prev.user, sortBy: e.target.value }
            }))}
            aria-label="Sort by"
            className="sort-select"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className={`report-issue-btn ${showForm ? 'cancel' : ''}`}
          onClick={() => updateState(prev => ({
            user: { ...prev.user, showForm: !prev.user.showForm }
          }))}
          disabled={!currentAccount}
          aria-label={showForm ? "Cancel issue form" : "Report new issue"}
        >
          {showForm ? (
            <>
              <span className="icon">✕</span> Cancel
            </>
          ) : (
            <>
              <span className="icon">+</span> Report Issue
            </>
          )}
        </button>
      </div>

      {showForm && (
        <IssueForm
          newIssue={newIssue}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          CATEGORY_ICONS={CATEGORY_ICONS}
        />
      )}

      <div className="issues-list">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              upvoteIssue={handleUpvote}
              currentAccount={currentAccount}
              CATEGORY_ICONS={CATEGORY_ICONS}
              onViewDetails={viewIssueDetails}
              isUpvoted={upvotedIssues.includes(issue.id)}
            />
          ))
        ) : (
          <div className="no-issues">
            <div className="no-issues-icon">📭</div>
            <h3>No issues found</h3>
            <p>Try adjusting your filters or report a new issue</p>
            {!currentAccount && (
              <p className="connect-wallet-prompt">
                Connect your wallet to report issues
              </p>
            )}
          </div>
        )}
      </div>

      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          onClose={closeIssueDetails}
          upvoteIssue={handleUpvote}
          currentAccount={currentAccount}
          CATEGORY_ICONS={CATEGORY_ICONS}
          isUpvoted={upvotedIssues.includes(selectedIssue.id)}
          addComment={addComment}
        />
      )}
    </main>
  );
};

const AdminActionForm = ({ 
  selectedAction, 
  selectedIssue, 
  actionFormData, 
  handleActionInputChange, 
  handleActionSubmit, 
  handleAdminAction,
  STATUS_OPTIONS,
  DEPARTMENTS
}) => {
  if (!selectedAction) return null;
  
  switch (selectedAction) {
    case 'status_update':
      return (
        <div className="admin-action-form-container">
          <form onSubmit={handleActionSubmit} className="admin-form">
            <h3>Update Status for: <span className="issue-title">{selectedIssue.title}</span></h3>
            
            <div className="form-group">
              <label htmlFor="newStatus">New Status*</label>
              <select
                id="newStatus"
                name="newStatus"
                value={actionFormData.newStatus || ''}
                onChange={handleActionInputChange}
                required
                className="status-select"
              >
                <option value="">Select status</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            {actionFormData.newStatus === 'Rejected' && (
              <div className="form-group">
                <label htmlFor="rejectionReason">Rejection Reason*</label>
                <textarea
                  id="rejectionReason"
                  name="rejectionReason"
                  value={actionFormData.rejectionReason || ''}
                  onChange={handleActionInputChange}
                  required
                  placeholder="Explain why this request is being rejected"
                  rows="4"
                />
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => handleAdminAction('cancel')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
              >
                Update Status
              </button>
            </div>
          </form>
        </div>
      );
      
    case 'assign_department':
      return (
        <div className="admin-action-form-container">
          <form onSubmit={handleActionSubmit} className="admin-form">
            <h3>Assign Department for: <span className="issue-title">{selectedIssue.title}</span></h3>
            
            <div className="form-group">
              <label htmlFor="departmentAssignment">Department*</label>
              <select
                id="departmentAssignment"
                name="departmentAssignment"
                value={actionFormData.departmentAssignment || ''}
                onChange={handleActionInputChange}
                required
                className="department-select"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => handleAdminAction('cancel')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
              >
                Assign Department
              </button>
            </div>
          </form>
        </div>
      );
      
    default:
      return null;
  }
};

const AdminIssueCard = ({ 
  issue, 
  handleAdminAction,
  CATEGORY_ICONS 
}) => {
  const getDepartment = () => {
    if (issue.assignedDepartment) return issue.assignedDepartment;
    
    switch (issue.category) {
      case 'Road': return 'Transport';
      case 'Sanitation': return 'Sanitation';
      case 'Water': return 'Water';
      case 'Electricity': return 'Power';
      case 'Green Space': return 'Parks';
      case 'Public Toilet': return 'Sanitation';
      default: return 'General';
    }
  };
  
  const statusClass = issue.status.toLowerCase().replace(' ', '-');
  const createdAtDate = new Date(issue.createdAt);
  const timeAgo = Math.floor((new Date() - createdAtDate) / (1000 * 60 * 60 * 24));
  
  return (
    <div className={`admin-issue-card status-${statusClass}`}>
      <div className="admin-issue-header">
        <h3>{issue.title}</h3>
        <div className="issue-meta">
          <span className="issue-id">ID: {issue.id}</span>
          <span className={`status-badge ${statusClass}`}>{issue.status}</span>
        </div>
      </div>
      
      <div className="admin-issue-content">
        <div className="issue-image">
          <img src={issue.image} alt={issue.title} />
        </div>
        
        <div className="issue-details">
          <div className="detail-row">
            <span className="detail-label">Category:</span>
            <span className="detail-value">
              {CATEGORY_ICONS[issue.category]} {issue.category}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Department:</span>
            <span className="detail-value">{getDepartment()}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Location:</span>
            <span className="detail-value">📍 {issue.location}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Reported:</span>
            <span className="detail-value">
              {createdAtDate.toLocaleDateString()} ({timeAgo} day{timeAgo !== 1 ? 's' : ''} ago)
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Votes:</span>
            <span className="detail-value">👍 {issue.votes}</span>
          </div>
        </div>
      </div>
      
      <div className="admin-issue-actions">
        <button 
          onClick={() => handleAdminAction('status_update', issue)}
          className="action-btn primary"
          aria-label={`Update status for ${issue.title}`}
        >
          Update Status
        </button>
        
        <button 
          onClick={() => handleAdminAction('assign_department', issue)}
          className="action-btn secondary"
          aria-label={`Assign department for ${issue.title}`}
        >
          Assign Department
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = ({ 
  state, 
  updateAdminState,
  handleAdminAction,
  handleActionInputChange,
  handleActionSubmit,
  CATEGORY_ICONS,
  STATUS_OPTIONS,
  DEPARTMENTS,
  toggleViewMode
}) => {
  const { 
    adminView, 
    departmentFilter, 
    statusFilter,
    selectedAction,
    selectedIssue,
    actionFormData
  } = state.admin;

  const getAdminIssues = useCallback(() => {
    let filtered = [...state.issues];
    
    if (adminView === 'appeals') {
      filtered = filtered.filter(issue => 
        ['Green Space', 'Public Toilet'].includes(issue.category)
      );
    }
    
    if (departmentFilter !== 'All') {
      filtered = filtered.filter(issue => {
        if (issue.assignedDepartment) {
          return issue.assignedDepartment === departmentFilter;
        }
        
        // Default department assignments based on category
        switch (issue.category) {
          case 'Road': return departmentFilter === 'Transport';
          case 'Sanitation': return departmentFilter === 'Sanitation';
          case 'Water': return departmentFilter === 'Water';
          case 'Electricity': return departmentFilter === 'Power';
          case 'Green Space': return departmentFilter === 'Parks';
          case 'Public Toilet': return departmentFilter === 'Sanitation';
          default: return departmentFilter === 'General';
        }
      });
    }
    
    if (statusFilter !== 'All') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }
    
    return filtered;
  }, [state.issues, adminView, departmentFilter, statusFilter]);

  const adminIssues = getAdminIssues();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Administrator Dashboard</h2>
        <div className="admin-controls">
          <button 
            onClick={() => updateAdminState({ adminView: 'issues' })}
            className={adminView === 'issues' ? 'active' : ''}
          >
            All Issues
          </button>
          <button 
            onClick={() => updateAdminState({ adminView: 'appeals' })}
            className={adminView === 'appeals' ? 'active' : ''}
          >
            Public Appeals
          </button>
          <button 
            onClick={toggleViewMode}
            className="view-toggle-btn"
          >
            Switch to User View
          </button>
        </div>
      </div>

      <div className="admin-filters">
        <div className="filter-group">
          <label htmlFor="departmentFilter">Filter by Department:</label>
          <select
            id="departmentFilter"
            value={departmentFilter}
            onChange={(e) => updateAdminState({ departmentFilter: e.target.value })}
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => updateAdminState({ statusFilter: e.target.value })}
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-issues-list">
        {adminIssues.length > 0 ? (
          adminIssues.map(issue => (
            <AdminIssueCard
              key={issue.id}
              issue={issue}
              handleAdminAction={handleAdminAction}
              CATEGORY_ICONS={CATEGORY_ICONS}
            />
          ))
        ) : (
          <div className="no-issues">
            <p>No issues found matching your filters</p>
          </div>
        )}
      </div>

      {selectedAction && (
        <AdminActionForm
          selectedAction={selectedAction}
          selectedIssue={selectedIssue}
          actionFormData={actionFormData}
          handleActionInputChange={handleActionInputChange}
          handleActionSubmit={handleActionSubmit}
          handleAdminAction={handleAdminAction}
          STATUS_OPTIONS={STATUS_OPTIONS}
          DEPARTMENTS={DEPARTMENTS}
        />
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [state, setState] = useState(DEFAULT_STATE);

  const updateState = (newState) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const updateAdminState = (newAdminState) => {
    setState(prev => ({
      ...prev,
      admin: { ...prev.admin, ...newAdminState }
    }));
  };

  const updateUserState = (newUserState) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, ...newUserState }
    }));
  };

  const connectWallet = async () => {
    updateState({ isWalletConnecting: true });
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockAccount = "0x1234567890123456789012345678901234567890";
      const isAdmin = ADMIN_ADDRESSES.includes(mockAccount.toLowerCase());
      
      updateState({
        currentAccount: mockAccount,
        isWalletConnecting: false,
        isAdmin,
        notification: {
          message: `Wallet connected ${isAdmin ? 'as admin' : 'successfully'}`,
          type: "success"
        }
      });
    } catch (error) {
      updateState({
        isWalletConnecting: false,
        notification: {
          message: "Failed to connect wallet",
          type: "error"
        }
      });
    }
  };

  const disconnectWallet = () => {
    updateState({
      currentAccount: null,
      isAdmin: false,
      notification: {
        message: "Wallet disconnected",
        type: "info"
      }
    });
  };

  const closeNotification = () => {
    updateState({ notification: null });
  };

  const toggleViewMode = () => {
    updateState({
      isAdmin: !state.isAdmin,
      notification: {
        message: `Switched to ${!state.isAdmin ? 'admin' : 'user'} view`,
        type: "info"
      }
    });
  };

  const upvoteIssue = (issueId) => {
    updateState(prev => ({
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? { ...issue, votes: issue.votes + 1 }
          : issue
      ),
      notification: {
        message: "Issue upvoted successfully!",
        type: "success"
      }
    }));
  };

  const getFilteredAndSortedIssues = useCallback(() => {
    let filtered = [...state.issues];

    // Filter by active tab
    if (state.user.activeTab === "my") {
      filtered = filtered.filter(
        issue => issue.userAddress === state.currentAccount
      );
    } else if (state.user.activeTab === "pending") {
      filtered = filtered.filter(issue => issue.status === "Pending");
    }

    // Filter by category
    if (state.user.filterCategory !== "All") {
      filtered = filtered.filter(
        issue => issue.category === state.user.filterCategory
      );
    }

    // Filter by search term
    if (state.user.searchTerm) {
      const term = state.user.searchTerm.toLowerCase();
      filtered = filtered.filter(
        issue =>
          issue.title.toLowerCase().includes(term) ||
          issue.description.toLowerCase().includes(term) ||
          issue.location.toLowerCase().includes(term)
      );
    }

    // Sort issues
    switch (state.user.sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "most-voted":
        filtered.sort((a, b) => b.votes - a.votes);
        break;
      case "least-voted":
        filtered.sort((a, b) => a.votes - b.votes);
        break;
      default:
        break;
    }

    return filtered;
  }, [state.issues, state.user, state.currentAccount]);

  const handleAdminAction = (action, issue = null) => {
    if (action === 'cancel') {
      updateAdminState({
        selectedAction: null,
        selectedIssue: null,
        actionFormData: DEFAULT_ADMIN_STATE.actionFormData
      });
      return;
    }

    if (issue) {
      updateAdminState({
        selectedAction: action,
        selectedIssue: issue
      });
    }
  };

  const handleActionInputChange = (e) => {
    const { name, value } = e.target;
    updateAdminState({
      actionFormData: {
        ...state.admin.actionFormData,
        [name]: value
      }
    });
  };

  const handleActionSubmit = (e) => {
    e.preventDefault();
    const { selectedAction, selectedIssue, actionFormData } = state.admin;

    if (selectedAction === 'status_update') {
      updateState(prev => ({
        issues: prev.issues.map(issue =>
          issue.id === selectedIssue.id
            ? {
                ...issue,
                status: actionFormData.newStatus,
                ...(actionFormData.newStatus === 'Rejected' && {
                  comments: [
                    ...issue.comments,
                    {
                      id: Date.now(),
                      user: "Administrator",
                      text: `Status changed to Rejected. Reason: ${actionFormData.rejectionReason}`,
                      createdAt: new Date().toISOString()
                    }
                  ]
                })
              }
            : issue
        ),
        notification: {
          message: `Status updated to ${actionFormData.newStatus}`,
          type: "success"
        }
      }));
    } else if (selectedAction === 'assign_department') {
      updateState(prev => ({
        issues: prev.issues.map(issue =>
          issue.id === selectedIssue.id
            ? {
                ...issue,
                assignedDepartment: actionFormData.departmentAssignment,
                status: "In Progress",
                comments: [
                  ...issue.comments,
                    {
                      id: Date.now(),
                      user: "Administrator",
                      text: `Assigned to ${actionFormData.departmentAssignment} department`,
                      createdAt: new Date().toISOString()
                    }
                  ]
              }
            : issue
        ),
        notification: {
          message: `Issue assigned to ${actionFormData.departmentAssignment}`,
          type: "success"
        }
      }));
    }

    // Reset action form
    updateAdminState({
      selectedAction: null,
      selectedIssue: null,
      actionFormData: DEFAULT_ADMIN_STATE.actionFormData
    });
  };

  return (
    <div className={`app-container ${state.darkMode ? 'dark-mode' : ''}`}>
      <Notification 
        notification={state.notification} 
        onClose={closeNotification} 
      />
      
      {state.currentAccount ? (
        <>
          <Header
            currentAccount={state.currentAccount}
            darkMode={state.darkMode}
            showUserProfile={state.showUserProfile}
            updateState={updateState}
            disconnectWallet={disconnectWallet}
            isAdmin={state.isAdmin}
            toggleViewMode={toggleViewMode}
          />
          
          <UserProfile
            currentAccount={state.currentAccount}
            userProfile={state.userProfile}
            updateState={updateState}
            showUserProfile={state.showUserProfile}
          />
          
          {state.isAdmin ? (
            <AdminDashboard
              state={state}
              updateAdminState={updateAdminState}
              handleAdminAction={handleAdminAction}
              handleActionInputChange={handleActionInputChange}
              handleActionSubmit={handleActionSubmit}
              CATEGORY_ICONS={CATEGORY_ICONS}
              STATUS_OPTIONS={STATUS_OPTIONS}
              DEPARTMENTS={DEPARTMENTS}
              toggleViewMode={toggleViewMode}
            />
          ) : (
            <MainContent
              state={state}
              updateState={updateState}
              getFilteredAndSortedIssues={getFilteredAndSortedIssues}
              upvoteIssue={upvoteIssue}
              CATEGORY_ICONS={CATEGORY_ICONS}
              currentAccount={state.currentAccount}
            />
          )}
        </>
      ) : (
        <WalletConnectScreen
          connectWallet={connectWallet}
          isWalletConnecting={state.isWalletConnecting}
        />
      )}
    </div>
  );
};

export default App;
