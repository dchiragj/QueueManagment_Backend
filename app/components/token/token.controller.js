const { createResponse, createError } = require( '../../utils/helpers' );
const service = require( '../../services/tokenService' );
const { USER_ROLE_TYPES } = require( '../../config/constants' );
const Queue = require( '../../models/queue' );
const Token = require( '../../models/token' );
const User = require( '../../models/user' );
const { Op } = require( 'sequelize' );
// tokens.controller.js

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

  async getServicingTokens( req, res ) {
    try {
      const { user } = req;
      const { queueId } = req.params;
      const { categoryId } = req.query;

      const queue = await Queue.findByPk( queueId );
      if ( !queue ) {
        return createError( res, { message: 'Queue not found' } );
      }

      if ( queue.merchant !== user.id ) {
        return createError( res, { message: 'Unauthorized to access this queue' }, 403 );
      }

      const validCategoryId = categoryId ? parseInt( categoryId ) : queue.category;
      if ( isNaN( validCategoryId ) ) {
        return createError( res, { message: 'Invalid categoryId' }, 400 );
      }

      // Include PENDING and SKIPPED tokens
      const tokens = await Token.findAll( {
        where: {
          queueId: queueId,
          // categoryId: validCategoryId,
          status: [ 'PENDING', 'SKIPPED' ]  // Changed: Include SKIPPED
        },
        include: [
          {
            model: User,
            as: 'customer',
            attributes: [ 'id', 'FirstName', 'LastName' ]
          },
          {
            model: Queue,
            as: 'queue',
            attributes: [ 'id', 'name' ]
          }
        ],
        order: [ [ 'tokenNumber', 'ASC' ] ]  // Order by tokenNumber; skipped will appear after PENDING if tokenNumber is higher
      } );

      if ( tokens.length > 0 ) {
        // Add a flag for frontend to show "Skipped" badge
        const enrichedTokens = tokens.map( token => ( {
          ...token.toJSON(),
          isSkipped: token.status === 'SKIPPED'
        } ) );
        return createResponse( res, 'ok', 'Servicing Tokens by Category', enrichedTokens );
      } else {
        return createResponse( res, 'ok', 'No tokens found for this category', [] );
      }
    } catch ( e ) {
      return createError( res, e );
    }
  }
  async getQueueTokenCounts( req, res ) {

    try {
      const { category, merchantId, start_date, end_date } = req.query;
      const where = {};
      if ( category ) where.category = category;
      if ( merchantId ) where.merchant = merchantId;
      if ( start_date && end_date ) {
        where.start_date = { [ Op.lte ]: new Date( end_date ) };
        where.end_date = { [ Op.gte ]: new Date( start_date ) };
      }

      const queues = await Queue.findAll( {
        where,
        attributes: [ 'id', 'name', 'category', 'start_date', 'status', 'noOfDesk', 'merchant' ],
        raw: true
      } );

      const result = await Promise.all(
        queues.map( async ( queue ) => {
          const tokenCount = await Token.count( { where: { queueId: queue.id } } );
          return { ...queue, tokenCount };
        } )
      );

      return res.json( { status: 'ok', message: 'Token counts', data: result } );
    } catch ( error ) {
      return res.status( 500 ).json( { status: 'error', message: error.message } );
    }
  }
  async getSkippedTokens( req, res ) {
    try {
      const { user } = req;
      const { queueId } = req.params;
      const { categoryId } = req.query;

      const queue = await Queue.findByPk( queueId );
      if ( !queue ) {
        return createError( res, { message: 'Queue not found' } );
      }

      if ( queue.merchant !== user.id ) {
        return createError( res, { message: 'Unauthorized to access this queue' }, 403 );
      }

      const validCategoryId = categoryId ? parseInt( categoryId ) : queue.category;
      if ( isNaN( validCategoryId ) ) {
        return createError( res, { message: 'Invalid categoryId' }, 400 );
      }

      // Include PENDING and SKIPPED tokens
      const tokens = await Token.findAll( {
        where: {
          queueId: queueId,
          // categoryId: validCategoryId,
          status: 'SKIPPED'  // Changed: Include SKIPPED
        },
        include: [
          {
            model: User,
            as: 'customer',
            attributes: [ 'id', 'FirstName', 'LastName' ]
          },
          {
            model: Queue,
            as: 'queue',
            attributes: [ 'id', 'name' ]
          }
        ],
        order: [ [ 'tokenNumber', 'ASC' ] ]  // Order by tokenNumber; skipped will appear after PENDING if tokenNumber is higher
      } );

      if ( tokens.length > 0 ) {
        // Add a flag for frontend to show "Skipped" badge
        const enrichedTokens = tokens.map( token => ( {
          ...token.toJSON(),
          isSkipped: token.status === 'SKIPPED'
        } ) );
        return createResponse( res, 'ok', 'Servicing Tokens by Category', enrichedTokens );
      } else {
        return createResponse( res, 'ok', 'No tokens found for this category', [] );
      }
    } catch ( e ) {
      return createError( res, e );
    }
  }
  /**
 * @description Skip a token by updating its status to SKIPPED
 */
  async skipTokens( req, res ) {
    try {
      const { user } = req;
      const { tokenIds } = req.body;

      if ( !Array.isArray( tokenIds ) || tokenIds.length === 0 ) {
        return createError( res, { message: 'Valid token IDs array is required' }, 400 );
      }

      const updatedTokens = [];
      for ( const id of tokenIds ) {
        const tokenId = parseInt( id );
        if ( isNaN( tokenId ) ) {
          continue;
        }

        const token = await Token.findOne( {
          where: { id: tokenId },
          include: [
            {
              model: Queue,
              as: 'queue',
              attributes: [ 'id', 'merchant' ],
            },
          ],
        } );

        if ( !token || token.queue.merchant !== user.id || [ 'SKIPPED', 'COMPLETED', 'CANCELLED' ].includes( token.status ) ) {
          continue; // Skip invalid tokens instead of failing the entire request
        }

        await token.update( {
          status: 'SKIPPED',
          updatedAt: new Date(),
        } );

        const updatedToken = await Token.findOne( {
          where: { id: tokenId },
          include: [
            { model: User, as: 'customer', attributes: [ 'id', 'FirstName', 'LastName' ] },
            { model: Queue, as: 'queue', attributes: [ 'id', 'name' ] },
          ],
        } );

        updatedTokens.push( {
          id: updatedToken.id,
          queueId: updatedToken.queueId,
          queueName: updatedToken.queue.name,
          tokenNumber: updatedToken.tokenNumber,
          customerId: updatedToken.customerId,
          customerName: updatedToken.customer
            ? `${ updatedToken.customer.FirstName } ${ updatedToken.customer.LastName }`.trim()
            : 'Unknown Customer',
          categoryId: updatedToken.categoryId,
          status: updatedToken.status,
          createdAt: updatedToken.createdAt,
          updatedAt: updatedToken.updatedAt,
        } );
      }

      if ( updatedTokens.length === 0 ) {
        return createError( res, { message: 'No valid tokens to skip' }, 400 );
      }

      return createResponse( res, 'ok', 'Tokens skipped successfully', updatedTokens );
    } catch ( e ) {
      console.error( 'Skip tokens error:', e.message, e.stack );
      return createError( res, { message: e.message || 'Failed to skip tokens' }, 500 );
    }
  }
  /**
   * @description Recover a skipped token - set to PENDING and reassign next available token number
   */
  async recoverSkippedToken( req, res ) {
    console.log( "recoverSkippedToken" );

    try {
      const { user } = req;
      const { tokenNumber } = req.body;
      console.log( tokenNumber, "tokenNumber1" );


      if ( !tokenNumber || isNaN( tokenNumber ) ) {
        return createError( res, { message: 'Valid tokenNumber is required' }, 400 );
      }

      // Step 1: Find the SKIPPED token
      const token = await Token.findOne( {
        where: {
          tokenNumber: parseInt( tokenNumber ),
          status: 'SKIPPED'
        },
        include: [
          { model: Queue, as: 'queue', attributes: [ 'id', 'merchant', 'category' ] }
        ]
      } );

      if ( !token ) {
        return createError( res, { message: 'Skipped token not found' }, 404 );
      }

      // if (token.queue.merchant !== user.id) {
      //   return createError(res, { message: 'Unauthorized' }, 403);
      // }

      // Step 2: Get current "now serving" token number
      const currentServingToken = await Token.findOne( {
        where: {
          queueId: token.queueId,
          categoryId: token.categoryId,
          status: 'ACTIVE' // or use your logic for "now serving"
        },
        order: [ [ 'tokenNumber', 'DESC' ] ]
      } );

      // If no ACTIVE, find the highest PENDING token
      let nextTokenNumber;
      if ( currentServingToken ) {
        nextTokenNumber = currentServingToken.tokenNumber + 1;
      } else {
        const highestPending = await Token.findOne( {
          where: {
            queueId: token.queueId,
            categoryId: token.categoryId,
            status: 'PENDING'
          },
          order: [ [ 'tokenNumber', 'DESC' ] ]
        } );
        nextTokenNumber = highestPending ? highestPending.tokenNumber + 1 : token.tokenNumber;
      }

      // Step 3: Update token
      await token.update( {
        status: 'PENDING',
        tokenNumber: nextTokenNumber,
        updatedAt: new Date()
      } );

      // Step 4: Return updated token
      const updatedToken = await Token.findOne( {
        where: { id: token.id },
        include: [
          { model: User, as: 'customer', attributes: [ 'FirstName', 'LastName' ] },
          { model: Queue, as: 'queue', attributes: [ 'name' ] }
        ]
      } );
      console.log( updatedToken, "updatedToken1" );


      return createResponse( res, 'ok', 'Token recovered and re-queued', {
        id: updatedToken.id,
        oldTokenNumber: parseInt( tokenNumber ),
        newTokenNumber: updatedToken.tokenNumber,
        status: 'PENDING',
        // customerName: `${updatedToken.customer.FirstName} ${updatedToken.customer.LastName}`.trim()
      } );

    } catch ( e ) {
      console.error( 'Recover error:', e );
      return createError( res, { message: e.message || 'Failed to recover token' } );
    }
  }
}

const tokenController = new TokenController();
module.exports = tokenController;
