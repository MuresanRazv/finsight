package org.finsight.coreapi.user;

public class UsageLimitExceededException extends RuntimeException {
    public UsageLimitExceededException(String message) {
        super(message);
    }
}
