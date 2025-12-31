import { ContactIcon, EmailIcon, LinkedInIcon, TwitterIcon, TelegramIcon, MessageIcon, RocketIcon, GlobeIcon } from './Icons'
import './ContactPage.css'

function ContactPage() {
  const email = 'deepak205032@gmail.com'
  const linkedin = '0x7db021efa5a5e96cc97b093b7e874fa82019dcfe' // Note: This appears to be an address, not a LinkedIn URL
  const twitter = 'https://x.com/cubic_bezier'
  const telegram = 'https://t.me/Deepakroxx'

  const handleEmailClick = () => {
    window.location.href = `mailto:${email}`
  }

  const handleLinkedInClick = () => {
    // Since it's an address, we'll show it as a contract address or copy to clipboard
    navigator.clipboard.writeText(linkedin)
    alert('Address copied to clipboard: ' + linkedin)
  }

  const handleTwitterClick = () => {
    window.open(twitter, '_blank', 'noopener,noreferrer')
  }

  const handleTelegramClick = () => {
    window.open(telegram, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="contact-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-title">
            <ContactIcon size={24} className="header-icon" />
            <h1>Contact</h1>
          </div>
          <p className="page-subtitle">Get in touch with me through any of these channels</p>
        </div>

        <div className="contact-content">
          <div className="contact-cards">
            <div className="contact-card email-card" onClick={handleEmailClick}>
              <div className="card-glow email-glow"></div>
              <EmailIcon size={32} className="contact-icon" />
              <h2>Email</h2>
              <p className="contact-value">{email}</p>
              <div className="contact-action">Click to send email →</div>
            </div>

            <div className="contact-card linkedin-card" onClick={handleLinkedInClick}>
              <div className="card-glow linkedin-glow"></div>
              <LinkedInIcon size={32} className="contact-icon" />
              <h2>LinkedIn</h2>
              <p className="contact-value address-value">{linkedin}</p>
              <div className="contact-action">Click to copy address →</div>
            </div>

            <div className="contact-card twitter-card" onClick={handleTwitterClick}>
              <div className="card-glow twitter-glow"></div>
              <TwitterIcon size={32} className="contact-icon" />
              <h2>Twitter / X</h2>
              <p className="contact-value">{twitter.replace('https://', '')}</p>
              <div className="contact-action">Click to open profile →</div>
            </div>

            <div className="contact-card telegram-card" onClick={handleTelegramClick}>
              <div className="card-glow telegram-glow"></div>
              <TelegramIcon size={32} className="contact-icon" />
              <h2>Telegram</h2>
              <p className="contact-value">@Deepakroxx</p>
              <div className="contact-action">Click to open Telegram →</div>
            </div>
          </div>

          <div className="contact-info">
            <div className="info-section">
              <MessageIcon size={24} className="section-icon" />
              <h3>Let's Connect</h3>
              <p>Feel free to reach out for collaborations, questions, or just to say hello!</p>
            </div>

            <div className="info-section">
              <RocketIcon size={24} className="section-icon" />
              <h3>Quick Response</h3>
              <p>I typically respond to emails and messages within 24-48 hours.</p>
            </div>

            <div className="info-section">
              <GlobeIcon size={24} className="section-icon" />
              <h3>Social Media</h3>
              <p>Follow me on Twitter for updates on projects and blockchain development.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage

