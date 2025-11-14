const Queue = require( '../models/queue' );
const RepositoryWithUserService = require( './repositoryWithUserService' );
const problemAndSolutionService = require( './problemAndSolutionService' );
const deskService = require( './deskService' );
const { PS_TYPES, RADIUS, QUEUE_STATUS } = require( '../config/constants' );
const moment = require( 'moment' );
const { userFriendlyString, createError } = require( '../utils/helpers' );
const nodemailer = require( 'nodemailer' );
const QRCode = require( 'qrcode' );
const fs = require( 'fs' );
const User = require( '../models/user' );
const category = require( '../models/category' );
const path = require( 'path' );

const validateQueueInputs = ( queue ) => {
  try {
    if ( !queue ) throw Error( 'Queue data is required' );
    else if ( !queue.name ) throw Error( 'Queue Name is required' );
    else if ( !queue.category ) throw Error( 'Queue Category is required' );
    else if ( !queue.description ) throw Error( 'Description is required' );
    // else if (!queue.status) throw Error('Status is required');
    // else if (!queue.noOfDesk || queue.noOfDesk <= 0 || queue.noOfDesk > 26)
    //   throw Error('NoOfDesk is required and must be between 1 and 26');
    // else if (!queue.deskDetails || queue.deskDetails.length === 0) throw Error('Atleast one desk detail is required');
    // else if (queue.deskDetails.length !== queue.noOfDesk)
    //   throw Error('Need Desk details for all the no of Desks specified');
    // else if (
    //   queue.deskDetails.length !==
    //   queue.deskDetails.filter((value, index, self) => self.findIndex((x) => x.username === value.username) === index)
    //     .length
    // ) {
    //   throw Error('Desk username must be unique');
    // } else if (!queue.problems || queue.problems.length === 0) throw Error('Atleast one problem selection is required');
    // else if (
    //   queue.problems.length !==
    //   queue.problems.filter(
    //     (value, index, self) =>
    //       self.findIndex((x) => userFriendlyString(String(x)) === userFriendlyString(String(value))) === index,
    //   ).length
    // ) {
    //   throw Error(`Problems must be unique`);
    // } else if (!queue.solutions || queue.solutions.length === 0)
    //   throw Error('Atleast one solution selection is required');
    // else if (
    //   queue.solutions.length !==
    //   queue.solutions.filter(
    //     (value, index, self) =>
    //       self.findIndex((x) => userFriendlyString(String(x)) === userFriendlyString(String(value))) === index,
    //   ).length
    // ) {
    //   throw Error('solutions must be unique');
    // } 
    else if ( !queue.start_date ) throw Error( 'Start date is required' );
    else if ( !queue.end_date ) throw Error( 'End date is required' );
    else if ( moment( new Date( queue.end_date ) ).isBefore( new Date( queue.start_date ) ) )
      throw Error( 'End date/time must be greater than start date/time' );
    else if ( !queue.start_number ) throw Error( 'Start number is required' );
    else if ( !queue.end_number ) throw Error( 'End number is required' );
    else if ( Number( queue.end_number ) <= Number( queue.start_number ) )
      throw Error( 'End number must be greater than start number' );
    // else if (!queue.lattitude) throw Error('Lattitude is required');
    // else if (!queue.longitude) throw Error('Longitude is required');
    if ( queue.isCancelled ) {
      if ( !queue.cancelledBy ) throw Error( 'CancelledBy is required for cancelled queue' );
      else if ( !queue.cancelled_date ) throw Error( 'Cancelled date is required for cancelled queue' );
      else if ( !queue.cancelled_comment ) throw Error( 'Cancelled comment is required for cancelled queue' );
    }
    return true;
  } catch ( e ) {
    throw e;
  }
};

const getDateQuery = async ( startDate, endDate ) => {
  if ( !startDate && !endDate ) return;
  if ( !endDate ) endDate = startDate;
  else if ( !startDate ) startDate = endDate;

  // get diff in days for looping
  const start = moment( startDate );
  const end = moment( endDate );
  const days = end.diff( start, 'days' ); // days in number

  if ( days >= 0 ) {
    let dateArr = [];
    let date = startDate;
    // +1 days to include last date also
    for ( let i = 0; i < days + 1; i++ ) {
      const obj = {
        [ i ]: {
          start_date: { $lte: date },
          end_date: { $gte: date },
        },
      };
      dateArr.push( obj );
      date = moment( date )
        .add( 1, 'd' )
        .format( 'YYYY-MM-DD' );
    }

    dateArr = dateArr.map( ( item, i ) => item[ i ] );
    return dateArr;
  }
  return;
};
const transporter = nodemailer.createTransport( {
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USERNAME, // Your Gmail address (e.g., yourapp@gmail.com)
    pass: process.env.SMTP_PASSWORD, // Your Gmail password or App Password (for 2FA)
  },
} );

class QueueService extends RepositoryWithUserService {
  constructor () {
    super( Queue );
  }

  // async create(userId, payload) {
  //   try {
  //     if (!payload) return;
  //     if (validateQueueInputs(payload)) {
  //       // remove problems & solutions from payload as they are not needed in queue collection
  //       let obj = JSON.parse(JSON.stringify(payload));
  //       delete payload.problems;
  //       delete payload.solutions;
  //       delete payload.deskDetails;

  //       payload = {
  //         ...payload,
  //         status: QUEUE_STATUS.WAITING,
  //       };
  //       const result = await super.create(userId, payload);
  //       if (result) {
  //         await deskService.insertMany(userId, result.id, obj.deskDetails);
  //         await problemAndSolutionService.insertMany(userId, PS_TYPES.PROBLEMS, result.id, obj.problems);
  //         await problemAndSolutionService.insertMany(userId, PS_TYPES.SOLUTIONS, result.id, obj.solutions);

  //         const item = await this.getSingle(userId, result.id);
  //         return item;
  //       }
  //       return undefined;
  //     }
  //   } catch (e) {
  //     throw e;
  //   }
  // }

  async create( userId, payload ) {
    try {
      if ( !payload ) return;
      // 1. VALIDATE – exactly ONE joinMethod
      if ( !payload.joinMethods ) {
        throw new Error( 'Exactly one join method must be selected' );
      }
      const selectedMethod = payload.joinMethods;

      if ( validateQueueInputs( payload ) ) {
        // 2. Clean payload for DB (remove extra fields)
        const obj = JSON.parse( JSON.stringify( payload ) );
        delete payload.problems;
        delete payload.solutions;
        delete payload.deskDetails;

        payload = {
          ...payload,
          status: QUEUE_STATUS.WAITING,
          joinMethods: payload.joinMethods,
        };

        // 3. CREATE QUEUE + related records
        const result = await super.create( userId, payload );
        if ( !result ) return undefined;
        if (payload.joinMethods === "location") {
          if(!payload.latitude || !payload.longitude)
            return createError( res, { message: 'Invalid lat & long provided' } );
        }

        await deskService.insertMany( userId, result.id, obj.deskDetails );
        await problemAndSolutionService.insertMany( userId, PS_TYPES.PROBLEMS, result.id, obj.problems );
        await problemAndSolutionService.insertMany( userId, PS_TYPES.SOLUTIONS, result.id, obj.solutions );

        const item = await this.getSingle( userId, result.id );

        // 4. FETCH USER EMAIL
        const user = await User.findByPk( userId );
        console.log( user, "user email" );

        if ( !user?.email ) throw new Error( 'User email not found' );
        const userEmail = user.email;

        // 5. PREPARE QR-CODE DIRECTORY
        const qrDir = path.resolve( __dirname, '../../qrcodes' );
        if ( !fs.existsSync( qrDir ) ) fs.mkdirSync( qrDir, { recursive: true } );

        // 6. BUILD EMAIL CONTENT (method-specific)
        const baseUrl = process.env.BASE_URL;
        const tokenRange = `${ item.start_number } to ${ item.end_number }`;
        let emailText = `A new queue has been created: **${ item.name }**\n`;
        emailText += `Token numbers: ${ tokenRange }\n\n`;
        const attachments = [];

        // ---------- PRIVATE ----------
        if ( selectedMethod === 'private' ) {
          emailText += `**Invite-only code:** ${ item.joinCode }\n`;
          emailText += `Give this 6-digit code to guests so they can join.\n\n`;
        }

        // ---------- LINK ----------
        if ( selectedMethod === 'link' ) {
          const shareLink = `${ baseUrl }/join?queueId=${ result.id }&categoryId=${result.category}`;
          emailText += `**Shareable link:** ${ shareLink }\n`;
          emailText += `Anyone with this link can join the queue.\n\n`;
        }

        // ---------- QR ----------
        if ( selectedMethod === 'qr' ) {
          const uniqueQrCodeName = `${ item.name.replace( /\s+/g, '_' ) }_${ Date.now() }`;
          const qrData = JSON.stringify( {
            queueId: result.id,
            queueName: item.name,
            tokenRange :`${item.start_number} to ${item.end_number}`,
            category: payload.category,
          } );
          const qrPath = path.join( qrDir, `${ uniqueQrCodeName }.png` );
          await QRCode.toFile( qrPath, qrData );

          attachments.push( {
            filename: `${ uniqueQrCodeName }.png`,
            path: qrPath,
          } );

          emailText += `**QR-code attached** – scan it to join instantly.\n`;
        }

        // 7. SEND EMAIL
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: userEmail,
          subject: `Queue created – ${ item.name }`,
          text: emailText,
          attachments,
        };

        await transporter.sendMail( mailOptions );
        console.log( 'Queue-creation email sent' );

        // 8. RETURN FRESH QUEUE (with joinCode if private)
        return item;
      }
    } catch ( e ) {
      throw e;
    }
  }
  async getSingleById( id ) {
    try {
      if ( !id ) return;

      const result = await Queue.findOne( { _id: id } );
      if ( result ) return result.toJSON();
      return undefined;
    } catch ( e ) {
      throw e;
    }
  }

  // async getByFilter(category, id, start_date, end_date, coordinates) {
  //   try {
  //     let query = {};
  //     if (category) {
  //       query = { ...query, category };
  //     }
  //     if (id) {
  //       query = { ...query, merchant: merchantId };
  //     }
  //     // filter by date range, if any date includes in queue date range, that queue will be visible
  //     const dateArr = await getDateQuery(start_date, end_date);
  //     if (dateArr) {
  //       query = { ...query, $or: dateArr };
  //     }
  //     if (coordinates) {
  //       query = {
  //         ...query,
  //         location: {
  //           $near: {
  //             $maxDistance: RADIUS, // in 3 km area from given coordinates
  //             $geometry: {
  //               type: 'Point',
  //               coordinates: JSON.parse(coordinates),
  //             },
  //           },
  //         },
  //       };
  //     }
  //     const result = await Queue.find(query);
  //     if (result) return result.map((item) => item.toJSON());
  //     return result;
  //   } catch (e) {
  //     throw e;
  //   }
  // }
  async getByFilter( category, merchantId, start_date, end_date, coordinates ) {
    try {
      const query = {};
      if ( category ) query.category = category;
      if ( merchantId ) query.merchant = merchantId;
      // Filter by date range
      if ( start_date && end_date ) {
        query.start_date = { [ Op.lte ]: new Date( end_date ) };
        query.end_date = { [ Op.gte ]: new Date( start_date ) };
      }
      const result = await Queue.findAll( { where: query } );
      return result.map( ( item ) => item.toJSON() );
    } catch ( e ) {
      throw e;
    }
  }


  async getCompletedQueues( userId ) {
    try {
      const result = await Queue.find( { uid: userId, status: { $in: [ QUEUE_STATUS.COMPLETED ] } } ).sort( {
        date: -1,
        createdAt: -1,
      } );

      if ( result ) {
        return result.map( ( item ) => {
          return item.toJSON( true );
        } );
      }
      return undefined;
    } catch ( e ) {
      throw e;
    }
  }
}

const service = new QueueService();
module.exports = service;
