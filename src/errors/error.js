class IncompleteDataError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.key = 'INCOMPLETE_DATA';
    this.message = message ? message : 'The submitted data is incomplete.';
  }
}

class IncorrectDataError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.key = 'INCORRECT_DATA';
    this.message = message ? message : 'The submitted data is incorrect.';
  }
}

class SqlQueryError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.key = 'SQL_QUERY_FAILED';
    this.message = message ? message : 'The executed SQL query failed.';
  }
}

class ModuleOperationError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.key = 'MODULE_OPERATION_FAILED';
    this.message = message ? message : 'External module operation failed.';
  }
}

class AccessRightsError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.key = 'INSUFFICIENT_ACCESS_RIGHTS';
    this.message = message ? message : 'Insufficient access rights.';
  }
}

class UserDeactivatedError extends Error {
  constructor(message, deactivatedUntil) {
    super(message);
    this.name = this.constructor.name;
    this.key = 'USER_DEACTIVATED';
    this.message = message ? message : 'The user is deactivated.';
    this.data = { "deactivatedUntil": new Date(deactivatedUntil).toUTCString() };
  }
}

module.exports = {
  IncompleteDataError,
  IncorrectDataError,
  SqlQueryError,
  AccessRightsError,
  UserDeactivatedError
};