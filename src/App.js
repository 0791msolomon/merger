import React, { Component } from 'react';
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from 'react-places-autocomplete';
import Input from '@material-ui/core/Input';
import { auth, db } from './auth';
import GMB from 'google_my_business';
import uuid from 'uuid';
import './App.css';
import axios from 'axios';

const companyID = uuid()

class App extends Component {

  state = {
    business: '',
    email: '',
    password: '',
    businessLookup: '',
    bID: '',
    tier: 'pro',
    nextPageToken: 'ABHRLXXiYMObqDx6VBEwJoz9VoqCyVJoXlu78c-N6moRKdGRIpybgDC-JJWQfYRrxvFzhbHYxwRK7GVSo8RX6HdWsOTTkGWYBcSBs_3mcYzMq_-w10QYYde-HKLekS3KnIrxlaJ_l0gChkxWMnCbJxnqy1TfsTfCbA',
    hasNextPage: false,
    groups: [],
    x: [],
    y: []
  }

  handleChange = business => {
    this.setState({ business });
  };

  componentDidMount(){
    let to;
    db.ref('token').once('value', (x) => this.setState({ token: x.val() }))
    .then(() => console.log(this.state.token))
    db.ref('refreshToken').once('value', (x) => {
      to = x.val()
      console.log(to);
    })
  }

  getter = () => {
    axios({
      method: "GET",
      url: `https://mybusiness.googleapis.com/v4/accounts/115765606782133461651/locations/`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.state.token,
      }
    }).then((res) => {
      let nextPageToken = res.data.nextPageToken
      console.log(nextPageToken);
      this.setState({ nextPageToken })
      this.state.x.push(res.data)
    }).then(() => this.next())
  }

  next = () => {
    axios({
      method: "GET",
      url: `https://mybusiness.googleapis.com/v4/accounts/115765606782133461651/locations?alt=json&pageToken=${this.state.nextPageToken}`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.state.token,
      }
    }).then((res) => {
      this.state.y.push(res.data.locations)
    }).then(() => this.findInfo())
  }

  findInfo = () => {
    let { x, y } = this.state;
    let data = []
    let hey = []
    data.push(y)
    data.map((z) => {
      hey.push(z[0])
      hey.filter((o) => {
        console.log(o);
      })
    })
  }

  setter = () => {
    let city = "Hartland"
    let phonenumber = "(262) 367-3808"
    let state = "WI"
    let address = "530 Norton Dr"
    let latitude = 43.09718
    let longitude = -88.35238900000002
    let website = "http://www.smellgoodplumber.com/"
    let placeID = "ChIJ_YWmjjqyBYgRaWS17WR3UWw"
    let locationID = "1613235960214572075"
    let logoURL = this.state.logoURL
    let business = "Austin Plumbing Company"
    let mapURL = this.state.mapURL

    db.ref(`companies/${companyID}`).set({
      address: {
        city,
        phonenumber,
        state,
        street: address,
        longitude,
        latitude
      },
      website,
      placeID,
      locationID: locationID ? locationID : null,
      mapURL: mapURL ? mapURL : null,
      logo: logoURL ? logoURL : null,
      name: business,
      tier: this.state.tier
    }).then(() => db.ref(`companies/${companyID}/employees/J6q9OighDdTD9NtGDqEJLSQMIpT2`).set({
      avatar: 'https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png',
      email: "esmith@austinpl.com",
      id: "J6q9OighDdTD9NtGDqEJLSQMIpT2",
      name: "Eric Smith",
      reviewCounts: 0,
      reviewInvites: 0,
      username: "Eric"
    })).then(() => db.ref(`users/J6q9OighDdTD9NtGDqEJLSQMIpT2/bID/1`).set({companyID}))
    .then(() => console.log(`Set at ${companyID}`))
  }

  handleSelect = address => {
    let business = address.split(',')[0]
    this.setState({ business })
    geocodeByAddress(address)
    .then((res) => {
      console.log(res);
      res.map((x) => {
        let placeID = x.place_id;
        let formattedAddress = x.formatted_address;
        let address = formattedAddress.split(',')[0]
        let city = formattedAddress.split(',')[1]
        let formattedState = formattedAddress.split(',')[2];
        let state = formattedState.replace(/[0-9]/g, '').trim()
        this.setState({ address, city, state, placeID })
      })
      getLatLng(res[0]).then(n => this.setState({ latitude: n.lat, longitude: n.lng, finished: true }))
    })
      .catch(error => console.error('Error', error));
    }
    fetchToken = () => {
      console.log('called');
      db.ref('token').once('value', (x) => this.setState({ token: x.val() }))
      .then(() => console.log(this.state.token))
      .then(() => this.fetchLID())
    }

    fetchLID = () => {
      let { groups } = this.state;
      let locations = []
      let business = this.state.business;
      this.setState({ loading: true })
      GMB.options({version: 'v4'})
      GMB.setAccessToken(`${this.state.token}`)
      GMB.api(`accounts/115765606782133461651/locations`, 'get',((res) => {
        groups.push(JSON.parse(res))
        groups.map((x) => {
          if(x.nextPageToken){
            this.setState({ nextPageToken: x.nextPageToken, hasNextPage: true })

          } else {

          }
          let location = x.locations
          location && location.map((y) => {
            let locationInfo = []
            if(y.locationName.includes(business)){
              locationInfo.push(y)
              console.log(locationInfo);
              let phonenumber = y.primaryPhone
              let website = y.websiteUrl
              locationInfo.map((z) => {
                let name = z.name;
                let locationID = name.split('/')[3]
                this.setState({ locationID, website, phonenumber, loading: false })
              })
            }
          })
        })
      }))
    }

    getNextPage = () => {
      let { groups } = this.state;
      let locations = []
      let business = this.state.business;
      this.setState({ loading: true })
      GMB.options({version: 'v4'})
      GMB.setAccessToken(`${this.state.token}`)
      GMB.api(`accounts/115765606782133461651/locations?pageToken=ABHRLXXiYMObqDx6VBEwJoz9VoqCyVJoXlu78c-N6moRKdGRIpybgDC-JJWQfYRrxvFzhbHYxwRK7GVSo8RX6HdWsOTTkGWYBcSBs_3mcYzMq_-w10QYYde-HKLekS3KnIrxlaJ_l0gChkxWMnCbJxnqy1TfsTfCbA`, 'get',((res) => {
        groups.push(JSON.parse(res))
        console.log(groups);
        groups.map((x) => {
          let location = x.locations
          location && location.map((y) => {
            let locationInfo = []
            if(y.locationName.includes(business)){
              locationInfo.push(y)
              let phonenumber = y.primaryPhone
              let website = y.websiteUrl
              locationInfo.map((z) => {
                let name = z.name;
                let locationID = name.split('/')[3]
                this.setState({ locationID, website, phonenumber, loading: false })
              })
            }
          })
        })
      }))
    }

    checkClient = () => {
      let data = []
      if(this.state.locationID){
        GMB.options({version: 'v4'})
        GMB.setAccessToken(`${this.state.token}`)
        GMB.api(`accounts/115765606782133461651/locations/${this.state.locationID}`, 'get',((res) => {
          let result = JSON.parse(res)
          if(!result.error){
            this.setState({ gmbVerified: true })
            this.fetchVerifiedReviews()
          } else {
            this.setState({ gmbVerified: false })
          }
        }))
      } else {
        this.getClientMapURL()
        this.setState({ gmbVerified: false, hasChecked: true })
      }
    }

    getClientMapURL = () => {
      const { placeID } = this.state;
      this.setState({ mapURL: `https://www.google.com/maps/place/?q=place_id:${placeID}` })
    }

    fetchVerifiedReviews = () => {
      GMB.options({version: 'v4'})
      GMB.setAccessToken(`${this.state.token}`)
      GMB.api(`accounts/115765606782133461651/locations/${this.state.locationID}/reviews`, 'get',((res) => {
        let reviews = JSON.parse(res);

        reviews ?
        this.setState({ reviewCount: reviews.totalReviewCount, hasChecked: true }) :
        this.setState({ hasChecked: true })
      }))
    }

    createClient = () => {
      const {
        email,
        password,
        business,
        city,
        state,
        address,
        placeID,
        phonenumber,
        latitude,
        longitude,
        locationID,
        logoURL,
        mapURL,
        website } = this.state;

      auth.createUserWithEmailAndPassword(email, password)
      .then((user) => {
        let userID = user.user.uid;
        db.ref(`users/${userID}`).set({
          admin: true,
          avatar: 'https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png',
          bio: 'Tell us about yourself!',
          business,
          isVerified: true,
          bID: [companyID],
          email,
          name: email.split('@')[0],
          reviewInvites: 0,
          settings: {
            browserNotifications: false,
            defaultSettings: true,
            emailNotifications: true,
            facebook: false,
            reviewNotifications: true,
            twitter: false
          },
          username: email.split('@')[0]
        }).then(() => db.ref(`companies/${companyID}`).set({
          address: {
            city,
            phonenumber,
            state,
            street: address,
            longitude: parseFloat(longitude),
            latitude: parseFloat(latitude)
          },
          website,
          placeID,
          locationID: locationID ? locationID : null,
          mapURL: mapURL ? mapURL : null,
          logo: logoURL ? logoURL : null,
          name: business,
          tier: this.state.tier
        }))
        .then(() => db.ref(`companies/${companyID}/employees/${userID}`).set({
          avatar: 'https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png',
          email,
          id: userID,
          name: email.split('@')[0],
          reviewCounts: 0,
          reviewInvites: 0,
          username: email.split('@')[0]
        }))
        .then(() => db.ref(`companyIDs/id`).push(companyID))
        .then(() => this.setState({ loading: false, step: 3 }))
      })
    }

    findCompanyID = () => {
      let data = []
      db.ref(`companies`).once('value', (snap) => {
        snap.forEach((x) => {
          let item = x.val()
          let key = x.key
          data.push({ name: item.name, key })
          console.log(data);
        })
        data.map((x) => {
          x.name === this.state.businessLookup && this.setState({ bID: x.key });
        })
      })
    }

    addEmployee = () => {
      const {
        email,
        password,
        business,
        businessLookup,
        bID,
        city,
        state,
        address,
        placeID,
        phonenumber,
        latitude,
        longitude,
        locationID,
        logoURL,
        mapURL,
        website } = this.state;

      auth.createUserWithEmailAndPassword(email, password)
      .then((user) => {
        let userID = user.user.uid;
        db.ref(`users/${userID}`).set({
          admin: true,
          avatar: 'https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png',
          bio: 'Tell us about yourself!',
          business: businessLookup,
          isVerified: true,
          bID: [bID],
          email,
          name: email.split('@')[0],
          reviewInvites: 0,
          settings: {
            browserNotifications: false,
            defaultSettings: true,
            emailNotifications: true,
            facebook: false,
            reviewNotifications: true,
            twitter: false
          },
          username: email.split('@')[0]
        })
        .then(() => db.ref(`companies/${bID}/employees/${userID}`).set({
          avatar: 'https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png',
          email,
          id: userID,
          name: email.split('@')[0],
          reviewCounts: 0,
          reviewInvites: 0,
          username: email.split('@')[0]
        }))
        .then(() => this.setState({ message: 'Added Employee' }))
      })
    }

  render() {
    return (
      <div>
        <button onClick={this.next}>Find</button>
        <PlacesAutocomplete
              value={this.state.business}
              onChange={this.handleChange}
              onSelect={this.handleSelect}
          >
            {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
              <div style={{ width: '30%', paddingLeft: '50px', paddingTop: '30px' }}>
                <Input
                  fullWidth
                  autoFocus
                  {...getInputProps({
                    placeholder: 'Search Places ...',
                    className: 'location-search-input',
                  })}
                />
                <div className="autocomplete-dropdown-container">
                  {loading && <div>Loading...</div>}
                  {suggestions.map(suggestion => {
                    const className = 'suggestion-item'
                    return (
                      <div
                        {...getSuggestionItemProps(suggestion, { className })}
                        >
                        <strong>{suggestion.formattedSuggestion.mainText}   </strong>
                        <small>{suggestion.formattedSuggestion.secondaryText}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </PlacesAutocomplete>
          <div style={{ display: 'grid', width: '30%', paddingTop: '60px', paddingLeft: '50px' }}>
            <Input
              value={this.state.business}
              placeholder="Business"
              onChange={(e) => this.setState({ business: e.target.value })}
              />
            <Input
              value={this.state.address}
              placeholder="Address"
              onChange={(e) => this.setState({ address: e.target.value })}
              />
            <Input
              value={this.state.city}
              placeholder="City"
              onChange={(e) => this.setState({ city: e.target.value })}
              />
            <Input
              value={this.state.state}
              placeholder="State"
              onChange={(e) => this.setState({ state: e.target.value })}
              />
            <Input
              value={this.state.placeID}
              placeholder="Place ID"
              onChange={(e) => this.setState({ placeID: e.target.value })}
              />
            <Input
              value={this.state.latitude}
              placeholder="Latitude"
              onChange={(e) => this.setState({ latitude: e.target.value })}
              />
            <Input
              value={this.state.longitude}
              placeholder="Longitude"
              onChange={(e) => this.setState({ longitude: e.target.value })}
              />
            <hr />
            <p>Google My Business Information</p>
              <Input
                value={this.state.phonenumber}
                placeholder="Phone Number"
                onChange={(e) => this.setState({ phonenumber: e.target.value })}
                />
            <Input
              value={this.state.locationID}
              placeholder="Location ID"
              onChange={(e) => this.setState({ locationID: e.target.value })}
              />
            <Input
              value={this.state.website}
              placeholder="Website"
              onChange={(e) => this.setState({ website: e.target.value })}
              />
          </div>
          <div style={{ display: 'grid', width: '20%', paddingLeft: '120px' }}>
            <button onClick={this.fetchToken}>
              Find GMB Info
            </button>
            <button onClick={this.checkClient}>Test Account</button>
          </div>
          <div style={{ paddingLeft: '50px' }}>
            {this.state.gmbVerified && <p>{"GMB Verified"}</p>}
            {this.state.reviewCount && this.state.hasChecked ?
              <p>Total Google Reviews: {this.state.reviewCount}</p> :
                this.state.hasChecked ?
              <p>No Google Reviews Found</p> : null
            }
            {!this.state.gmbVerified && this.state.hasChecked &&
              <div>
                <p>{"Not GMB Verified"}</p>
                <p>Will this link below work?</p>
                <a href={this.state.mapURL} target="_blank">Link</a>
              </div>
            }
            {
              this.state.hasChecked && this.state.gmbVerified &&
              <button onClick={() => this.setState({ testsDone: true })}>Create Client Account</button>
            }

              <div style={{ display: 'grid', width: '30%' }}>
                <Input
                  onChange={(e) => this.setState({ email: e.target.value })}
                  placeholder="Client Email"
                  />
                <Input
                  onChange={(e) => this.setState({ password: e.target.value })}
                  placeholder="Client Password"
                  />
                <select onChange={(e) => console.log(e.target.value)}>
                  <option value='Pro'>Pro</option>
                  <option value={'Basic'}>Basic</option>
                </select>
                <button onClick={this.createClient}>Create</button>
              </div>

            {
              this.state.hasChecked && !this.state.gmbVerified &&
              <div style={{ display: 'grid', width: '20%' }}>
                <Input
                  onChange={(e) => this.setState({ mapURL: e.target.value })}
                  placeholder="Paste Google Map URL"
                  />
                <Input
                  onChange={(e) => this.setState({ website: e.target.value })}
                  placeholder="Client Website"
                  />
                <Input
                  onChange={(e) => this.setState({ email: e.target.value })}
                  placeholder="Client Email"
                  />
                <Input
                  onChange={(e) => this.setState({ password: e.target.value })}
                  placeholder="Client Password"
                  />
                <select onChange={(e) => console.log(e.target.value)}>
                  <option value='Pro'>Pro</option>
                  <option value={'Basic'}>Basic</option>
                </select>
                <button onClick={this.createClient}>Create Client Account</button>
              </div>
            }
            <button onClick={() => this.setState({ addEmployee: true })}>Add Employee to Existing Biz</button>
            {
              this.state.addEmployee &&
              <div style={{ display: 'grid', width: '30%' }}>
                <button onClick={this.findCompanyID}>Find Company ID</button>
                <Input
                  onChange={(e) => this.setState({ businessLookup: e.target.value })}
                  placeholder="Business Name"
                  />
                  <Input
                    value={this.state.bID}
                    onChange={(e) => this.setState({ bID: e.target.value })}
                    placeholder="Business ID"
                    />
                <Input
                  onChange={(e) => this.setState({ email: e.target.value })}
                  placeholder="Client Email"
                  />
                <Input
                  onChange={(e) => this.setState({ password: e.target.value })}
                  placeholder="Client Password"
                  />
                <button onClick={this.addEmployee}>Create Employee</button>
                {this.state.message && <p>{this.state.message}</p>}
              </div>
            }
          </div>
      </div>
    );
  }
}

export default App;
