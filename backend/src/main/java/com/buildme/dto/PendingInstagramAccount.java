package com.buildme.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * One Instagram Business account discovered during the FB OAuth callback,
 * before the user has chosen which to connect. The {@code pageAccessToken}
 * stays inside the signed session JWT held by the backend; it is NOT echoed
 * back to the browser in the picker GET response.
 *
 * {@code alreadyConnected} is populated only by the picker GET endpoint
 * (joined against existing {@code social_accounts} rows). It is absent from
 * the JWT payload — it's a UI flag, not part of identity.
 *
 * {@code profilePictureUrl} is best-effort re-fetched at picker GET time
 * and is omitted from the JWT to keep the signed payload under ~2KB.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PendingInstagramAccount(
    String igUserId,
    String igUsername,
    String displayName,
    String pageId,
    String pageAccessToken,
    String pageName,
    String profilePictureUrl,
    Boolean alreadyConnected
) {
    public PendingInstagramAccount withDisplayFields(String profilePictureUrl, boolean alreadyConnected) {
        return new PendingInstagramAccount(
            igUserId, igUsername, displayName, pageId, pageAccessToken, pageName,
            profilePictureUrl, alreadyConnected
        );
    }

    /** Strip the page token before returning over the wire. */
    public PendingInstagramAccount withoutPageToken() {
        return new PendingInstagramAccount(
            igUserId, igUsername, displayName, pageId, null, pageName,
            profilePictureUrl, alreadyConnected
        );
    }
}
