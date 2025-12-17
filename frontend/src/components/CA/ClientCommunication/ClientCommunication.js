// =====================================================
// CLIENT COMMUNICATION COMPONENT
// Document requests and messages to clients
// =====================================================

import React, { useState } from 'react';
import { Send, Mail, FileText, CheckCircle, Clock } from 'lucide-react';
import Button from '../../DesignSystem/components/Button';
import { formatIndianDateTime } from '../../../lib/format';
import { cn } from '../../../lib/utils';

const ClientCommunication = ({
  messages = [],
  onSendMessage,
  onRequestDocument,
  className = '',
}) => {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [emailNotification, setEmailNotification] = useState(true);

  const handleSend = async () => {
    if (!messageText.trim()) return;

    setSending(true);
    if (onSendMessage) {
      await onSendMessage({
        text: messageText,
        emailNotification,
        createdAt: new Date().toISOString(),
      });
    }
    setMessageText('');
    setSending(false);
  };

  const handleRequestDocument = (docType) => {
    if (onRequestDocument) {
      onRequestDocument(docType, emailNotification);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-heading-md font-semibold text-gray-800" style={{ fontSize: '18px', fontWeight: 600 }}>
        Client Communication
      </h3>

      {/* Messages List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-body-md text-slate-500 text-center py-8" style={{ fontSize: '14px', lineHeight: '22px' }}>
            No messages yet. Send a message to the client below.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'border rounded-xl p-4',
                message.type === 'document-request' ? 'border-info-200 bg-info-50' : 'border-slate-200 bg-white',
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {message.type === 'document-request' ? (
                    <FileText className="w-4 h-4 text-info-500" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="text-label-md font-medium text-slate-700" style={{ fontSize: '13px', fontWeight: 500 }}>
                    {message.type === 'document-request' ? 'Document Request' : 'Message'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {message.status === 'sent' ? (
                    <CheckCircle className="w-4 h-4 text-success-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-warning-500" />
                  )}
                  <span className="text-body-sm text-slate-500" style={{ fontSize: '13px', lineHeight: '20px' }}>
                    {formatIndianDateTime(message.createdAt)}
                  </span>
                </div>
              </div>

              <p className="text-body-md text-slate-700 mb-2" style={{ fontSize: '14px', lineHeight: '22px' }}>
                {message.text}
              </p>

              {message.documentType && (
                <div className="mt-2">
                  <span className="text-label-sm text-info-600 bg-info-100 px-2 py-1 rounded" style={{ fontSize: '11px', fontWeight: 500 }}>
                    Requested: {message.documentType}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Message Composer */}
      <div className="border-t border-slate-200 pt-4">
        <div className="space-y-3">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message to the client..."
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-body-md focus:outline-none focus:border-gold-500"
            style={{ fontSize: '14px', lineHeight: '22px', minHeight: '100px' }}
            rows={4}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotification}
                onChange={(e) => setEmailNotification(e.target.checked)}
                className="w-4 h-4 text-gold-500 border-slate-300 rounded focus:ring-gold-500"
              />
              <span className="text-body-sm text-slate-600" style={{ fontSize: '13px', lineHeight: '20px' }}>
                Send email notification
              </span>
            </label>

            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                onClick={() => handleRequestDocument('form16')}
              >
                <FileText className="w-4 h-4 mr-1" />
                Request Form 16
              </Button>
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={!messageText.trim() || sending}
              >
                <Send className="w-4 h-4 mr-1" />
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCommunication;

