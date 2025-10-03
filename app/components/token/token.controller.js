const { createResponse, createError } = require( '../../utils/helpers' );
const service = require( '../../services/tokenService' );
const { USER_ROLE_TYPES } = require( '../../config/constants' );

class TokenController {
  /**
   * @description get token list
   */
  async getTokenList( req, res ) {
    try {
      const { user } = req;
      const items = await service.gettokenlist( user.id, user.role );
      return createResponse( res, 'ok', 'token list not found ', items );
    } catch ( e ) {
      return createError( res, e );
    }
  }

  /**
   * @description get Completed token list
   */
  async getCompletedTokenList( req, res ) {
    try {
      const { user } = req;
      const items = await service.getCompletedTokens( user.id );
      if ( items ) return createResponse( res, 'ok', 'List', items );
      else return createError( res, { message: 'Unable to fetch token list' } );
    } catch ( e ) {
      return createError( res, e );
    }
  }

  /**
   * @description get token list by queue
   */
  async getTokenListByQueueId( req, res ) {
    try {
      const { user } = req;
      const { queueId } = req.params;
      const items = await service.getByQueueIds( user.id, queueId );
      if ( items ) return createResponse( res, 'ok', 'List', items );
      else return createError( res, { message: 'Unable to fetch token list by queueId' } );
    } catch ( e ) {
      return createError( res, e );
    }
  }

  /**
   * @description create queue item
   */
  async create( req, res ) {
    try {
      const { user } = req;
      if ( !( user.role === USER_ROLE_TYPES.CUSTOMER || user.role === USER_ROLE_TYPES.BOTH ) )
        return createError( res, { message: `You don't have access to create token, only customer can create token.` } );

      const item = await service.create( user.id, req.body );
      if ( item ) return createResponse( res, 'ok', 'Token created successfully', item );
      else return createError( res, { message: 'Unable to create token' } );
    } catch ( e ) {
      return createError( res, e );
    }
  }

  /**
   * @description get next token details
   */
  async getNextToken( req, res ) {
    try {
      const { user } = req;
      const { queueId } = req.params;
      const { date } = req.query;
      const result = await service.getNextToken( user.id, queueId, date );
      if ( result ) return createResponse( res, 'ok', 'Next Token', { number: result } );
      else return createError( res, { message: 'Unable to get next token number' } );
    } catch ( e ) {
      return createError( res, e );
    }
  }

  /**
   * @description get item details
   */
  async getDetails( req, res ) {
    try {
      const { user } = req;
      const { id } = req.params;
      const item = await service.getSingle( user.id, id );
      if ( item ) return createResponse( res, 'ok', 'Token', item );
      else return createError( res, { message: 'Token Item not found' } );
    } catch ( e ) {
      return createError( res, e );
    }
  }
}

const tokenController = new TokenController();
module.exports = tokenController;
