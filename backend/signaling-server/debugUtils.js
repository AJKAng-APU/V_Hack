/**
 * Log all registered users for debugging
 * @param {Object} users - Users object from UserManager
 */
function logRegisteredUsers(users) {
    console.log('==== REGISTERED USERS ====');
    Object.keys(users).forEach(id => {
      console.log(`- ${id}: ${users[id].length} connections`);
    });
    console.log('==========================');
  }
  
  /**
   * Log all active calls for debugging
   * @param {Object} activeCalls - Active calls from CallManager
   */
  function logActiveCalls(activeCalls) {
    console.log('==== ACTIVE CALLS ====');
    Object.keys(activeCalls).forEach(id => {
      const call = activeCalls[id];
      console.log(`- ${id}: ${call.caller} -> ${call.target} (${call.accepted ? 'accepted' : 'pending'})`);
    });
    console.log('=====================');
  }
  
  module.exports = { logRegisteredUsers, logActiveCalls };