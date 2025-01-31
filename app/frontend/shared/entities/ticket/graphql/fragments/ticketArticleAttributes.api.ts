import * as Types from '#shared/graphql/types.ts';

import gql from 'graphql-tag';
export const TicketArticleAttributesFragmentDoc = gql`
    fragment ticketArticleAttributes on TicketArticle {
  id
  internalId
  from {
    raw
    parsed {
      name
      emailAddress
      isSystemAddress
    }
  }
  messageId
  to {
    raw
    parsed {
      name
      emailAddress
      isSystemAddress
    }
  }
  cc {
    raw
    parsed {
      name
      emailAddress
      isSystemAddress
    }
  }
  subject
  replyTo {
    raw
    parsed {
      name
      emailAddress
      isSystemAddress
    }
  }
  messageId
  messageIdMd5
  inReplyTo
  contentType
  attachmentsWithoutInline {
    id
    internalId
    name
    size
    type
    preferences
  }
  preferences
  bodyWithUrls
  internal
  createdAt
  author {
    id
    fullname
    firstname
    lastname
    email
    active
    image
    vip
    outOfOffice
    outOfOfficeStartAt
    outOfOfficeEndAt
    authorizations {
      provider
      uid
      username
    }
  }
  type {
    name
    communication
  }
  sender {
    name
  }
  securityState {
    encryptionMessage
    encryptionSuccess
    signingMessage
    signingSuccess
    type
  }
  mediaErrorState {
    error
  }
  detectedLanguage
}
    `;