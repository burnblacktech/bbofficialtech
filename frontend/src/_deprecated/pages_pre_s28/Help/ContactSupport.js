// =====================================================
// CONTACT SUPPORT PAGE
// Contact support via live chat, email, or phone
// =====================================================

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Mail, Phone, ArrowLeft, Send, Clock, Upload, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supportService } from '../../features/help/services/support.service';
import { useMutation } from '@tanstack/react-query';

const ContactSupport = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium',
  });
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const createTicketMutation = useMutation({
    mutationFn: (ticketData) => supportService.createTicket(ticketData),
    onSuccess: (data) => {
      toast.success('Support ticket created successfully! Ticket ID: ' + data.ticketId);
      setTicketForm({ subject: '', message: '', category: 'general', priority: 'medium' });
      setAttachments([]);
      setMessage('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create support ticket');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'chat') {
      if (!message.trim()) {
        toast.error('Please enter a message');
        return;
      }
      setIsLoading(true);
      try {
        // TODO: Implement live chat API
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setMessage('');
      } catch (error) {
        toast.error('Failed to send message. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else if (activeTab === 'email') {
      if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }
      createTicketMutation.mutate({
        ...ticketForm,
        attachments,
      });
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.filter((file) => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });
    setAttachments((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/help"
          className="flex items-center text-body-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Help Center
        </Link>

        <div className="mb-8">
          <h1 className="text-heading-2xl text-slate-900 mb-4">Contact Support</h1>
          <p className="text-body-md text-slate-600">
            Get help from our support team
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'chat'
                    ? 'border-gold-500 text-gold-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Live Chat
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'email'
                    ? 'border-gold-500 text-gold-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Mail className="w-5 h-5 mr-2" />
                Email
              </button>
              <button
                onClick={() => setActiveTab('phone')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'phone'
                    ? 'border-gold-500 text-gold-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Phone className="w-5 h-5 mr-2" />
                Phone
              </button>
            </nav>
          </div>
        </div>

        {/* Live Chat */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
            <div className="mb-6">
              <h2 className="text-heading-lg text-slate-900 mb-2">Live Chat</h2>
              <p className="text-body-sm text-slate-600">
                Chat with our support team in real-time. Average response time: 2-3 minutes.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 h-64 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                    <span className="text-gold-600 text-body-regular font-medium">BB</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-xl p-3 shadow-elevation-1">
                      <p className="text-body-sm text-slate-900">
                        Hi! How can I help you today?
                      </p>
                    </div>
                    <p className="text-body-small text-slate-500 mt-1">Just now</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="px-6 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

            <div className="mt-4 flex items-center text-body-sm text-slate-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>Support hours: Monday - Friday, 9 AM - 6 PM IST</span>
            </div>
          </div>
        )}

        {/* Email */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
            <div className="mb-6">
              <h2 className="text-heading-lg text-slate-900 mb-2">Email Support</h2>
              <p className="text-body-sm text-slate-600">
                Send us an email and we'll get back to you within 24 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Category <span className="text-error-500">*</span>
                </label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  required
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Payment</option>
                  <option value="filing">ITR Filing Help</option>
                  <option value="account">Account Issues</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Priority <span className="text-error-500">*</span>
                </label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Subject <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder="What can we help you with?"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  required
                />
              </div>

              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Message <span className="text-error-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  placeholder="Describe your issue or question..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  required
                />
              </div>

              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Attachments (Optional)
                </label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="ticket-attachments"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label
                    htmlFor="ticket-attachments"
                    className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 text-body-sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files (Max 5MB each)
                  </label>
                  {attachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-xl"
                        >
                          <span className="text-body-sm text-slate-700 truncate flex-1">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="ml-2 text-error-600 hover:text-error-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={createTicketMutation.isPending}
                className="w-full py-2 px-4 bg-gold-500 text-white rounded-xl hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 flex items-center justify-center"
              >
                {createTicketMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Ticket...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Support Ticket
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-info-50 border border-info-200 rounded-xl">
              <p className="text-body-sm text-info-700">
                <strong>Email:</strong> support@burnblack.in
              </p>
              <p className="text-body-sm text-info-700 mt-1">
                <strong>Response Time:</strong> Within 24 hours
              </p>
            </div>
          </div>
        )}

        {/* Phone */}
        {activeTab === 'phone' && (
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
            <div className="mb-6">
              <h2 className="text-heading-lg text-slate-900 mb-2">Phone Support</h2>
              <p className="text-body-sm text-slate-600">
                Call us for immediate assistance with your ITR filing.
              </p>
            </div>

            <div className="space-y-6">
              <div className="text-center p-8 bg-slate-50 rounded-xl">
                <Phone className="mx-auto h-12 w-12 text-gold-600 mb-4" />
                <h3 className="text-heading-lg text-slate-900 mb-2">+91 1800-XXX-XXXX</h3>
                <p className="text-body-sm text-slate-600 mb-4">Toll-free number</p>
                <a
                  href="tel:+911800XXXXXX"
                  className="inline-flex items-center px-6 py-3 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-colors"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now
                </a>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="text-heading-sm text-slate-900 mb-2">Support Hours</h4>
                  <ul className="text-body-sm text-slate-600 space-y-1">
                    <li>Monday - Friday: 9:00 AM - 6:00 PM IST</li>
                    <li>Saturday: 10:00 AM - 2:00 PM IST</li>
                    <li>Sunday: Closed</li>
                  </ul>
                </div>

                <div className="p-4 bg-info-50 border border-info-200 rounded-xl">
                  <h4 className="text-heading-sm text-info-900 mb-2">What to have ready</h4>
                  <ul className="text-body-sm text-info-700 space-y-1 list-disc list-inside">
                    <li>Your PAN number</li>
                    <li>Account email or phone number</li>
                    <li>Description of your issue</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactSupport;

