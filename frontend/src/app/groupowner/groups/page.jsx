'use client'
import { useEffect, useState } from 'react'
import ModernLayout from '@/components/Layouts/groupownerLayout/Layout'
import { FiUsers, FiDollarSign, FiCalendar, FiPlus, FiLink, FiX, FiCopy } from 'react-icons/fi'
import styles from './groups.module.scss'

// Category options from your schema
const CATEGORIES = [
  'technology',
  'entertainment',
  'business',
  'education',
  'health',
  'lifestyle',
  'sports',
  'other'
]

export default function GroupsPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    groupName: '',
    telegramGroupLink: '',
    telegramGroupId: '',
    description: '',
    category: 'other', // Default value from schema
    subscriptionFrequency: 'monthly',
    subscriptionPrice: '',
    currency: 'NGN'
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groupowner/groups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch groups')
      
      const { data } = await response.json()
      // Ensure each group has a category
      const groupsWithCategory = data.map(group => ({
        ...group,
        category: group.category || 'other'
      }))
      setGroups(groupsWithCategory)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.groupName) errors.groupName = 'Group name is required'
    if (!formData.telegramGroupLink) errors.telegramGroupLink = 'Telegram link is required'
    if (!formData.telegramGroupId) errors.telegramGroupId = 'Telegram group ID is required'
    if (!formData.subscriptionPrice || isNaN(formData.subscriptionPrice)) {
      errors.subscriptionPrice = 'Valid price is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groupowner/creategroup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })
      

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create group')
      }

      const { group } = await response.json()
      setGroups(prev => [{
        ...group,
        category: group.category || 'other' // Ensure category exists
      }, ...prev])
      setShowCreateModal(false)
      setFormData({
        groupName: '',
        telegramGroupLink: '',
        telegramGroupId: '',
        description: '',
        category: 'other',
        subscriptionFrequency: 'monthly',
        subscriptionPrice: '',
        currency: 'NGN'
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount).replace('NGN', '₦')
  }

  // Format category for display (capitalize first letter)
  const formatCategory = (category) => {
    if (!category) return 'Other'
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  if (loading) return (
    <ModernLayout>
      <div className={styles.loadingContainer}>
        <p>Loading your groups...</p>
      </div>
    </ModernLayout>
  )

  if (error) return (
    <ModernLayout>
      <div className={styles.errorContainer}>
        <p>Error: {error}</p>
      </div>
    </ModernLayout>
  )

  return (
    <ModernLayout>
      <div className={styles.groupsContainer}>
        <div className={styles.header}>
          <h1>Your Groups</h1>
          <button 
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus /> Create New Group
          </button>
        </div>

        {groups.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You haven't created any groups yet</p>
            <button 
              className={styles.createButton}
              onClick={() => setShowCreateModal(true)}
            >
              <FiPlus /> Create Your First Group
            </button>
          </div>
        ) : (
          <div className={styles.groupsGrid}>
            {groups.map(group => (
              <div key={group.id} className={styles.groupCard}>
                <div className={styles.cardHeader}>
                  <h3>{group.name}</h3>
                  <span className={styles.meta}>
                    • Created {formatDate(group.createdAt)}
                  </span>
                </div>
                
                <p className={styles.description}>{group.description}</p>
                
                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <FiUsers className={styles.statIcon} />
                    <span>{group.members} members</span>
                  </div>
                  
                  <div className={styles.statItem}>
                    <FiDollarSign className={styles.statIcon} />
                    <span>{formatCurrency(group.price)}/{group.frequency}</span>
                  </div>
                </div>
                
                <div className={styles.links}>
                  {group.telegramLink && (
                    <a href={group.telegramLink} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                      <FiLink /> Telegram Group
                    </a>
                  )}
                  <button
  type="button"
  onClick={() => handleCopyLink(group.shareLink)}
  className={styles.linkButton}
>
  <FiCopy /> Copy Link
</button>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2>Create New Group</h2>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                >
                  <FiX />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="groupName">Group Name*</label>
                  <input
                    type="text"
                    id="groupName"
                    name="groupName"
                    value={formData.groupName}
                    onChange={handleInputChange}
                    className={formErrors.groupName ? styles.errorInput : ''}
                  />
                  {formErrors.groupName && <span className={styles.errorText}>{formErrors.groupName}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="telegramGroupLink">Telegram Group Link*</label>
                  <input
                    type="url"
                    id="telegramGroupLink"
                    name="telegramGroupLink"
                    value={formData.telegramGroupLink}
                    onChange={handleInputChange}
                    className={formErrors.telegramGroupLink ? styles.errorInput : ''}
                    placeholder="https://t.me/yourgroup"
                  />
                  {formErrors.telegramGroupLink && <span className={styles.errorText}>{formErrors.telegramGroupLink}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="telegramGroupId">Telegram Group ID*</label>
                  <input
                    type="text"
                    id="telegramGroupId"
                    name="telegramGroupId"
                    value={formData.telegramGroupId}
                    onChange={handleInputChange}
                    className={formErrors.telegramGroupId ? styles.errorInput : ''}
                    placeholder="e.g., -1001234567890"
                  />
                  {formErrors.telegramGroupId && <span className={styles.errorText}>{formErrors.telegramGroupId}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {formatCategory(category)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="subscriptionFrequency">Subscription Frequency*</label>
                    <select
                      id="subscriptionFrequency"
                      name="subscriptionFrequency"
                      value={formData.subscriptionFrequency}
                      onChange={handleInputChange}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="subscriptionPrice">Price (₦)*</label>
                    <input
                      type="number"
                      id="subscriptionPrice"
                      name="subscriptionPrice"
                      value={formData.subscriptionPrice}
                      onChange={handleInputChange}
                      className={formErrors.subscriptionPrice ? styles.errorInput : ''}
                      min="0"
                    />
                    {formErrors.subscriptionPrice && <span className={styles.errorText}>{formErrors.subscriptionPrice}</span>}
                  </div>
                </div>
                
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  )
}