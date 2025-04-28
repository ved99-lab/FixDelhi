 <div className="profile-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Display Name</label>
              <input 
                type="text" 
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="How you want to be known"
                maxLength={20}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself (optional)"
                maxLength={150}
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  name="notificationsEnabled"
                  checked={formData.notificationsEnabled}
                  onChange={handleChange}
                />
                Enable notifications
              </label>
            </div>
            
            <div className="profile-stats">
              <h3>Your Stats</h3>
              <div className="stats-items">
                {[
                  { label: "Issues reported:", value: userStats.reported },
                  { label: "Resolved issues:", value: userStats.resolved },
                  { label: "Comments made:", value: userStats.comments }
                ].map((stat, index) => (
                  <div key={index} className="stat-item">
                    <span>{stat.label}</span>
                    <span>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="wallet-connection">
              <h3>Connected Wallet</h3>
              <p className="wallet-address">{currentAccount}</p>
            </div>
            
            <button type="submit" className="save-profile-btn">Save Profile</button>
          </form>
        </div>
      </div>
    );
  };

  const IssueCard = ({ issue }) => {
    const [commentText, setCommentText] = useState("");

    const shareIssue = () => {
      if (navigator.share) {
        navigator.share({
          title: `FixDelhi: ${issue.title}`,
          text: `Check out this civic issue in Delhi: ${issue.title} at ${issue.location}`,
          url: `https://fixdelhi.app/issue/${issue.id}`
        }).catch(console.error);
      } else {
        const shareText = `Check out this civic issue in Delhi: ${issue.title} at ${issue.location} - https://fixdelhi.app/issue/${issue.id}`;
        navigator.clipboard.writeText(shareText)
          .then(() => showNotification("Share link copied to clipboard!"))
          .catch(() => showNotification("Failed to copy share link", "error"));
      }
    };

    const handleAddComment = () => {
      if (!commentText.trim()) return;
      updateState(prev => ({
        issues: prev.issues.map(i => 
          i.id === issue.id 
            ? { 
                ...i, 
                comments: [...i.comments, { 
                  id: Date.now(), 
                  user: currentAccount || "Anonymous", 
                  text: commentText 
                }] 
              } 
            : i
        )
      }));
      setCommentText("");
    };

    return (
      <div className={`issue-card status-${issue.status.toLowerCase().replace(' ', '-')}`}>
        <div className="issue-header">
          <div className="title-with-icon">
            <span className="category-icon">{CATEGORY_ICONS[issue.category]}</span>
            <h3>{issue.title}</h3>
          </div>
          <span className="status-badge">{issue.status}</span>
        </div>
        
        <p className="issue-description">{issue.description}</p>
        
        <div className="issue-meta">
          <span>📍 {issue.location}</span>
          <span>🏷️ {issue.category}</span>
          {issue.userAddress === currentAccount && (
            <span className="your-issue">Your Submission</span>
          )}
          <span className="issue-date">
            📅 {new Date(issue.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <img src={issue.image} alt={issue.title} className="issue-image" />
        
        <div className="issue-actions">
          <div className="action-buttons">
            <button className="vote-btn" onClick={() => upvoteIssue(issue.id)}>
              👍 Upvote ({issue.votes})
            </button>
            
            <button className="share-btn" onClick={shareIssue}>
              📤 Share
            </button>
          </div>
          
          <details className="comments-section">
            <summary>Comments ({issue.comments.length})</summary>
            <div className="comments-list">
              {issue.comments.map(comment => (
                <div key={comment.id} className="comment">
                  <strong>
                    {comment.user === currentAccount 
                      ? userProfile.displayName 
                      : `${comment.user.substring(0, 6)}...`}
                  </strong>: {comment.text}
                </div>
              ))}
              <div className="add-comment">
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <button onClick={handleAddComment}>Post</button>
              </div>
            </div>
          </details>
          
          {issue.userAddress === currentAccount && (
            <div className="status-controls">
              <label>Update Status:</label>
              <select
                value={issue.status}
                onChange={(e) => updateStatus(issue.id, e.target.value)}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  const MainContent = () => {
    const filteredIssues = getFilteredAndSortedIssues();

    return (
      <main className="main-content">
        <div className="controls">
          <div className="tabs">
            {["all", "my", "pending", "in progress", "resolved"].map(tab => (
              <button 
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => updateState({ activeTab: tab })}
              >
                {tab === "all" ? "All Issues" : 
                 tab === "my" ? "My Complaints" : 
                 tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          <button 
            className="primary-btn" 
            onClick={() => updateState({ showForm: !showForm })}
          >
            {showForm ? "Cancel" : "Report New Issue"}
          </button>
        </div>

        <div className="search-filter-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => updateState({ searchTerm: e.target.value })}
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => updateState({ searchTerm: "" })}
              >
                ×
              </button>
            )}
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => updateState({ filterCategory: e.target.value })}
              >
                <option value="All">All Categories</option>
                {Object.keys(CATEGORY_ICONS).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => updateState({ sortBy: e.target.value })}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="issue-form">
            <h2>Report New Issue</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title*</label>
                <input
                  type="text"
                  name="title"
                  value={newIssue.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Brief title of the issue"
                />
              </div>
              
              <div className="form-group">
                <label>Description*</label>
                <textarea
                  name="description"
                  value={newIssue.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Detailed description of the issue"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category*</label>
                  <select
                    name="category"
                    value={newIssue.category}
                    onChange={handleInputChange}
                  >
                    {Object.keys(CATEGORY_ICONS).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Location*</label>
                  <input
                    type="text"
                    name="location"
                    value={newIssue.location}
                    onChange={handleInputChange}
                    required
                    placeholder="Where is the issue located?"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Upload Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  aria-label="Upload an image of the issue"
                />
                {newIssue.image && (
                  <div className="image-preview">
                    <img src={newIssue.image} alt="Preview" />
                  </div>
                )}
              </div>
              
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Issue"}
              </button>
            </form>
          </div>
        )}

        <div className="issues-grid">
          {filteredIssues.length > 0 ? (
            filteredIssues.map(issue => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          ) : (
            <div className="no-issues">
              {searchTerm || filterCategory !== "All" ? (
                <>
                  <p>No issues found matching your search criteria</p>
                  <button 
                    className="clear-filters-btn"
                    onClick={() => updateState({ 
                      searchTerm: "",
                      filterCategory: "All"
                    })}
                  >
                    Clear Filters
                  </button>
                </>
              ) : activeTab === "my" ? (
                <>
                  <p>You haven't reported any issues yet</p>
                  <button 
                    className="primary-btn" 
                    onClick={() => updateState({ showForm: true })}
                  >
                    Report Your First Issue
                  </button>
                </>
              ) : (
                <p>No issues found in this category</p>
              )}
            </div>
          )}
        </div>
      </main>
    );
  };

  const Footer = () => (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <p>FixDelhi - Making Delhi better together</p>
          <p className="footer-stats">
            Total issues reported: {issues.length} | Resolved: {
              issues.filter(issue => issue.status === "Resolved").length
            }
          </p>
        </div>
        
        <div className="footer-section">
          <p className="wallet-info-footer">
            Connected as: {userProfile.displayName}
          </p>
          <p className="wallet-address-footer">
            Wallet: {`${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`}
          </p>
        </div>
      </div>
    </footer>
  );

  if (!currentAccount) {
    return <WalletConnectScreen />;
  }

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <Header />

      {showStats && <StatsDashboard />}
      {showMap && <MapView />}
      {showUserProfile && <UserProfile />}

      <MainContent />
      
      <Footer />
    </div>
  );
}

export default App;