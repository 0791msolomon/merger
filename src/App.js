import React, { Component } from "react";
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng
} from "react-places-autocomplete";
import Input from "@material-ui/core/Input";
import { auth, db } from "./auth";
import GMB from "google_my_business";
import uuid from "uuid";
import "./App.css";
import axios from "axios";
import { arch } from "os";
import "./App.css";
import Alert from "react-s-alert";
import "react-s-alert/dist/s-alert-default.css";
import "react-s-alert/dist/s-alert-css-effects/jelly.css";
import Modal from "react-responsive-modal";
import LoadingOverlay from "react-loading-overlay";
import { firebase } from "./auth";

const companyID = uuid();

class App extends Component {
  state = {
    business: "",
    email: "",
    password: "",
    businessLookup: "",
    bID: "",
    tier: "pro",
    testsDone: false,
    nextPageToken:
      "ABHRLXXiYMObqDx6VBEwJoz9VoqCyVJoXlu78c-N6moRKdGRIpybgDC-JJWQfYRrxvFzhbHYxwRK7GVSo8RX6HdWsOTTkGWYBcSBs_3mcYzMq_-w10QYYde-HKLekS3KnIrxlaJ_l0gChkxWMnCbJxnqy1TfsTfCbA",
    hasNextPage: false,
    groups: [],
    x: [],
    y: [],
    open: false,
    checked: false,
    businessIdButton: false,
    addEmployee: false,
    loading: false,
    gmbVerified: false
  };

  handleChange = business => {
    this.setState({ business });
  };

  componentDidMount() {
    let to;
    db.ref("token")
      .once("value", x => this.setState({ token: x.val() }))
      .then(() => console.log(this.state.token));
    db.ref("refreshToken").once("value", x => {
      to = x.val();
      console.log(to);
    });
    // this.checkCompany();
    this.checkemails();
  }
  checkemails = () => {
    // db.ref("companies/f90629e0-9909-483b-924d-125b7d7cc53f/employees").once(
    //   "value",
    //   snap => {
    //     let item = Object.values(snap.val());
    //     console.log(item);
    //     // item.map(item => console.log(item.bID));
    //   }
    // );
  };
  checkCompany = () => {
    db.ref("companies").once("value", snap => {
      let item = snap.val();
      let narr = Object.values(item);
      narr.map(item => console.log(item.name));
    });
  };

  sign = () => {
    let email = 'info@plumbproservices.com'
    let password = 'plumbpro19'

    let business = "PlumbPRO Services"
    let name = 'Amanda Joy'
  
    let city = 'Ambler'
    let state = 'PA'
    let street = 'Ambler, PA 19002, USA'
    let phonenumber = '(484) 222 0689'
  
    let latitude = 40.1054485
    let longitude = -75.2942502
  
    let facebookLink = 'https://www.facebook.com/plumbproservices484/'
    let placeID = 'ChIJ2aWGNzi7xokRgesCgOjhL0k'
    let website = 'https://plumbpro-services.business.site/'
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(user => {
        console.log(user.user.uid);
        firebase
          .database()
          .ref(`users/${user.user.uid}`)
          .set({
            admin: true,
            avatar:
              "https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png",
            bID: [companyID],
            business,
            email,
            isVerified: true,
            name,
            reviewInvites: 0,
            settings: {
              browserNotifications: false,
              defaultSettings: true,
              emailNotifications: true,
              facebook: false,
              reviewNotifications: false,
              twitter: false
            },
            username: name
          })
          .then(() =>
            firebase
              .database()
              .ref(`companies/${companyID}`)
              .set({
                address: {
                  city,
                  state,
                  latitude,
                  longitude,
                  phonenumber,
                  street
                },
                facebookLink,
                isVerified: false,
                name: business,
                placeID,
                reviews: "1",
                tier: "pro",
                website
              })
          )
          .then(() => {
            firebase
              .database()
              .ref(`companies/${companyID}/employees/${user.user.uid}`)
              .set({
                avatar:
                  "https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png",
                email,
                id: user.user.uid,
                name,
                reviewCounts: 0,
                reviewInvites: 0,
                username: name
              });
          })
          .then(() => {
            console.log("finished", companyID);
          })
          .catch(() => {
            console.log("fail");
          });
      });
  };

  // getFacebook = () => {
  //   db.ref(`companies`).once("value", snap => {
  //     snap.forEach(x => {
  //       let company = x.val();
  //       let bID = x.key;
  //       if (
  //         company.name.toLowerCase().includes(this.state.search.toLowerCase())
  //       ) {
  //         console.log("found", bID);
  //         console.log("name", company.name);
  //         this.setState({ bID });
  //         console.log("set", bID);
  //       }
  //       company.name.toLowerCase().includes(this.state.search.toLowerCase()) &&
  //         console.log("found", bID);
  //     });
  //   });
  // };

  // setFacebook = () => {
  //   db.ref(`companies/${this.state.bID}/facebookLink`)
  //     .set(this.state.facebook)
  //     .then(res => console.log("success"))
  //     .catch(err => console.log("error"));
  // };

  getter = () => {
    axios({
      method: "GET",
      url: `https://mybusiness.googleapis.com/v4/accounts/115765606782133461651/locations/`,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.state.token
      }
    })
      .then(res => {
        let nextPageToken = res.data.nextPageToken;
        console.log(nextPageToken);
        this.setState({ nextPageToken });
        this.state.x.push(res.data);
      })
      .then(() => this.next());
  };

  next = () => {
    axios({
      method: "GET",
      url: `https://mybusiness.googleapis.com/v4/accounts/115765606782133461651/locations?alt=json&pageToken=${
        this.state.nextPageToken
      }`,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.state.token
      }
    })
      .then(res => {
        this.state.y.push(res.data.locations);
      })
      .then(() => this.findInfo());
  };

  findInfo = () => {
    let { x, y } = this.state;
    let data = [];
    let hey = [];
    data.push(y);
    data.map(z => {
      hey.push(z[0]);
      hey.filter(o => {
        console.log(o);
      });
    });
  };

  setter = () => {
    let city = "Hartland";
    let phonenumber = "(262) 367-3808";
    let state = "WI";
    let address = "530 Norton Dr";
    let latitude = 43.09718;
    let longitude = -88.35238900000002;
    let website = "http://www.smellgoodplumber.com/";
    let placeID = "ChIJ_YWmjjqyBYgRaWS17WR3UWw";
    let locationID = "1613235960214572075";
    let logoURL = this.state.logoURL;
    let business = "Austin Plumbing Company";
    let mapURL = this.state.mapURL;

    db.ref(`companies/${companyID}`)
      .set({
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
      })
      .then(() =>
        db
          .ref(`companies/${companyID}/employees/J6q9OighDdTD9NtGDqEJLSQMIpT2`)
          .set({
            avatar:
              "https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png",
            email: "esmith@austinpl.com",
            id: "J6q9OighDdTD9NtGDqEJLSQMIpT2",
            name: "Eric Smith",
            reviewCounts: 0,
            reviewInvites: 0,
            username: "Eric"
          })
      )
      .then(() =>
        db.ref(`users/J6q9OighDdTD9NtGDqEJLSQMIpT2/bID/1`).set({ companyID })
      )
      .then(() => console.log(`Set at ${companyID}`));
  };

  handleSelect = address => {
    let business = address.split(",")[0];
    this.setState({ business });
    geocodeByAddress(address)
      .then(res => {
        console.log(res);
        res.map(x => {
          // let placeID = x.place_id;
          let formattedAddress = x.formatted_address;
          let address = formattedAddress.split(",")[0];
          let city = formattedAddress.split(",")[1];
          let formattedState = formattedAddress.split(",")[2];
          let state = formattedState.replace(/[0-9]/g, "").trim();
          this.setState({ address, city, state, finished: true });
        });
        // getLatLng(res[0]).then(n =>
        //   this.setState({ latitude: n.lat, longitude: n.lng, finished: true })
        // );
      })
      .catch(error => console.error("Error", error));
  };
  fetchToken = e => {
    e.preventDefault();
    this.setState({ loading: true }, () => {
      console.log("called");
      db.ref("token")
        .once("value", x => this.setState({ token: x.val() }))
        .then(() => {
          console.log(this.state.token);
        })
        .then(() => this.fetchLID());
    });
  };

  fetchLID = () => {
    let { groups } = this.state;
    let locations = [];
    let business = this.state.business;
    this.setState({ loading: true });
    GMB.options({ version: "v4" });
    GMB.setAccessToken(`${this.state.token}`);
    GMB.api(`accounts/115765606782133461651/locations`, "get", res => {
      groups.push(JSON.parse(res));
      this.setState({ nextPageToken: JSON.parse(res).nextPageToken }, () => {
        this.getNextPage();
      });
    });
  };
  getNextPage = () => {
    let { groups } = this.state;
    let locations = [];
    let business = this.state.business;
    console.log("token here", this.state.nextPageToken);
    this.setState({ loading: true });
    GMB.options({ version: "v4" });
    GMB.setAccessToken(`${this.state.token}`);
    GMB.api(
      `accounts/115765606782133461651/locations?alt=json&pageToken=${
        this.state.nextPageToken
      }`,
      "get",
      res => {
        groups.push(JSON.parse(res));
        this.getData(groups);
      }
    );
  };

  getData = groups => {
    let { business } = this.state;
    let group1 = groups[0].locations;
    let group2 = groups[1].locations;
    let allGroups = group1.concat(group2);
    console.log(allGroups);
    groups.map(x => {
      let location = x.locations;
      location &&
        location.map(y => {
          let locationInfo = [];
          let latitude, longitude;
          if (y.locationName.toUpperCase().includes(business.toUpperCase())) {
            locationInfo.push(y);
            let phonenumber = y.primaryPhone;
            let website = y.websiteUrl;
            let placeID = y.locationKey.placeId;
            if (y.serviceArea && y.serviceArea.radius) {
              latitude = y.serviceArea.radius.latlng.latitude;
              longitude = y.serviceArea.radius.latlng.longitude;
            } else if (y.latlng) {
              latitude = y.latlng.latitude;
              longitude = y.latlng.longitude;
            } else {
              latitude = 38.8977;
              longitude = 77.0365;
            }

            locationInfo.map(z => {
              let name = z.name;
              let locationID = name.split("/")[3];
              Alert.success("Located GMB info", {
                position: "top-right",
                effect: "jelly",
                onShow: function() {},
                beep: false,
                timeout: 1000,
                offset: 100
              });
              this.setState({
                placeID,
                latitude,
                longitude,
                locationID,
                website,
                phonenumber,
                loading: false
              });
            });
          }
        });
      if (this.state.loading) {
        this.setState(
          {
            loading: false
          },
          () => {
            Alert.error("Unable to find GMB info", {
              position: "top-right",
              effect: "jelly",
              onShow: function() {},
              beep: false,
              timeout: 1000,
              offset: 100
            });
          }
        );
      }
    });
  };

  // getNextPage = () => {
  //   let { groups } = this.state;
  //   let locations = [];
  //   let business = this.state.business;
  //   this.setState({ loading: true });
  //   GMB.options({ version: "v4" });
  //   GMB.setAccessToken(`${this.state.token}`);
  //   GMB.api(
  //     `accounts/115765606782133461651/locations?pageToken=ABHRLXXiYMObqDx6VBEwJoz9VoqCyVJoXlu78c-N6moRKdGRIpybgDC-JJWQfYRrxvFzhbHYxwRK7GVSo8RX6HdWsOTTkGWYBcSBs_3mcYzMq_-w10QYYde-HKLekS3KnIrxlaJ_l0gChkxWMnCbJxnqy1TfsTfCbA`,
  //     "get",
  //     res => {
  //       groups.push(JSON.parse(res));
  //       console.log(groups);
  //       groups.map(x => {
  //         let location = x.locations;
  //         location &&
  //           location.map(y => {
  //             let locationInfo = [];
  //             if (y.locationName.includes(business)) {
  //               console.log("look here ", y);
  //               locationInfo.push(y);
  //               let phonenumber = y.primaryPhone;
  //               let website = y.websiteUrl;
  //               locationInfo.map(z => {
  //                 let name = z.name;
  //                 let locationID = name.split("/")[3];

  //                 return this.setState(
  //                   {
  //                     locationID,
  //                     website,
  //                     phonenumber,
  //                     loading: false
  //                   },
  //                   () => {
  //                     Alert.success("Located GMB info", {
  //                       position: "top-right",
  //                       effect: "jelly",
  //                       onShow: function() {},
  //                       beep: false,
  //                       timeout: 1000,
  //                       offset: 100
  //                     });
  //                   }
  //                 );
  //               });
  //             }
  //           });
  //         if (this.state.loading) {
  // this.setState(
  //   {
  //     loading: false
  //   },
  //   () => {
  //     Alert.error("Unable to find GMB info", {
  //       position: "top-right",
  //       effect: "jelly",
  //       onShow: function() {},
  //       beep: false,
  //       timeout: 1000,
  //       offset: 100
  //     });
  //             }
  //           );
  //         }
  //       });
  //     }
  //   );
  // };

  checkClient = e => {
    e.preventDefault();
    let data = [];
    if (this.state.locationID) {
      GMB.options({ version: "v4" });
      GMB.setAccessToken(`${this.state.token}`);
      GMB.api(
        `accounts/115765606782133461651/locations/${this.state.locationID}`,
        "get",
        res => {
          let result = JSON.parse(res);
          if (!result.error) {
            this.setState({ gmbVerified: true });
            this.fetchVerifiedReviews();
          } else {
            this.setState({ gmbVerified: false });
          }
        }
      );
    } else {
      this.getClientMapURL();
      this.setState({ gmbVerified: false, hasChecked: true });
    }
  };

  getClientMapURL = () => {
    const { placeID } = this.state;
    this.setState({
      mapURL: `https://www.google.com/maps/place/?q=place_id:${placeID}`
    });
  };

  fetchVerifiedReviews = () => {
    GMB.options({ version: "v4" });
    GMB.setAccessToken(`${this.state.token}`);
    GMB.api(
      `accounts/115765606782133461651/locations/${
        this.state.locationID
      }/reviews`,
      "get",
      res => {
        let reviews = JSON.parse(res);

        reviews
          ? this.setState(
              {
                reviewCount: reviews.totalReviewCount,
                hasChecked: true
              },
              () => {
                this.state.reviewCount > 0
                  ? Alert.success("GMB verified!", {
                      position: "top-right",
                      effect: "jelly",
                      onShow: function() {},
                      beep: false,
                      timeout: 1000,
                      offset: 100
                    })
                  : Alert.error("Unable to find reviews", {
                      position: "top-right",
                      effect: "jelly",
                      onShow: function() {},
                      beep: false,
                      timeout: 1000,
                      offset: 100
                    });
              }
            )
          : this.setState({ hasChecked: true });
      }
    );
  };

  createClient = () => {
    const {
      gmbVerified,
      email,
      firstName,
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
      website
    } = this.state;

    auth
      .createUserWithEmailAndPassword(email, password)
      .then(user => {
        let userID = user.user.uid;
        db.ref(`users/${userID}`)
          .set({
            admin: true,
            avatar:
              "https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png",
            bio: "Tell us about yourself!",
            business,
            isVerified: true,
            bID: [companyID],
            email,
            name: firstName,
            reviewInvites: 0,
            settings: {
              browserNotifications: false,
              defaultSettings: true,
              emailNotifications: true,
              facebook: false,
              reviewNotifications: true,
              twitter: false
            },
            username: firstName
          })
          .then(() =>
            db.ref(`companies/${companyID}`).set({
              address: {
                city,
                phonenumber,
                state,
                street: address,
                longitude: parseFloat(longitude),
                latitude: parseFloat(latitude)
              },
              isVerified: gmbVerified,
              website,
              placeID,
              locationID: locationID ? locationID : null,
              mapURL: mapURL ? mapURL : null,
              logo: logoURL ? logoURL : null,
              name: business,
              tier: this.state.tier
            })
          )
          .then(() =>
            db.ref(`companies/${companyID}/employees/${userID}`).set({
              avatar:
                "https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png",
              email,
              id: userID,
              name: firstName,
              reviewCounts: 0,
              reviewInvites: 0,
              username: firstName
            })
          )
          .then(() => db.ref(`companyIDs/id`).push(companyID))
          .then(() => {
            this.setState({ open: false });
          })
          .then(() => {
            Alert.success("Client Account has been successfully added", {
              position: "top-right",
              effect: "jelly",
              onShow: function() {},
              beep: false,
              timeout: 1000,
              offset: 100
            });
          })
          .then(() => this.setState({ loading: false, step: 3 }));
      })
      .catch(() => {
        Alert.error("Unable to create user", {
          position: "top-right",
          effect: "jelly",
          onShow: function() {},
          beep: false,
          timeout: 1000,
          offset: 100
        });
        this.setState({ open: false });
      });
  };

  findCompanyID = e => {
    e.preventDefault();
    let data = [];
    db.ref(`companies`).once("value", snap => {
      snap.forEach(x => {
        let item = x.val();
        let key = x.key;
        data.push({ name: item.name, key });
        console.log(data);
      });
      data.map(x => {
        if (!x.name) {
          return;
        }
        if (
          x.name.toUpperCase().trim() ===
          this.state.businessLookup.toUpperCase().trim()
        ) {
          this.setState({ bID: x.key });
          Alert.success("Business ID matched", {
            position: "top-right",
            effect: "jelly",
            onShow: function() {},
            beep: false,
            timeout: 1000,
            offset: 100
          });
        }
      });
      if (!this.state.bID) {
        this.setState({ addEmployee: false }, () => {
          Alert.error("Could not match that name", {
            position: "top-right",
            effect: "jelly",
            onShow: function() {},
            beep: false,
            timeout: 1000,
            offset: 100
          });
        });
      }
    });
  };

  addEmployee = e => {
    e.preventDefault();
    const {
      email,
      firstName,
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
      website
    } = this.state;

    auth
      .createUserWithEmailAndPassword(email, password)
      .then(user => {
        let userID = user.user.uid;
        db.ref(`users/${userID}`)
          .set({
            admin: true,
            avatar:
              "https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png",
            bio: "Tell us about yourself!",
            business: businessLookup,
            isVerified: true,
            bID: [bID],
            email,
            name: firstName,
            reviewInvites: 0,
            settings: {
              browserNotifications: false,
              defaultSettings: true,
              emailNotifications: true,
              facebook: false,
              reviewNotifications: true,
              twitter: false
            },
            username: firstName
          })
          .then(() =>
            db
              .ref(
                `companies/f90629e0-9909-483b-924d-125b7d7cc53f/employees/${userID}`
              )
              .set({
                avatar:
                  "https://gordonswindowdecor.com/wp-content/uploads/sites/23/2015/06/person-placeholder.png",
                email,
                id: userID,
                name: firstName,
                reviewCounts: 0,
                reviewInvites: 0,
                username: firstName
              })
          )
          .then(() => {
            this.setState(
              {
                addEmployee: false,
                businessLookup: false,
                bID: "",
                firstName: ""
              },
              () => {
                Alert.success("Client Successfully Added", {
                  position: "top-right",
                  effect: "jelly",
                  onShow: function() {},
                  beep: false,
                  timeout: 1000,
                  offset: 100
                });
              }
            );
          });
      })
      .catch(() => {
        this.setState(
          { addEmployee: false, businessLookup: false, bID: "", firstName: "" },
          () => {
            Alert.error("Unable to add client", {
              position: "top-right",
              effect: "jelly",
              onShow: function() {},
              beep: false,
              timeout: 1000,
              offset: 100
            });
          }
        );
      });
  };

  findUserId = () => {
    db.ref(`companies`).once("value", snap => {
      let item = snap.val();
      item.forEach(item => console.log(item.employees));
    });
  };

  render() {
    return (
      <LoadingOverlay
        active={this.state.loading}
        spinner
        text="Searching GMB info..."
      >
        <div id="container">
          <button onClick={this.sign}> sign company</button>
          <div className="col-4">
            <input
              type="text"
              className="form-control"
              placeholder="Employee Name"
              value={this.state.searchForName}
              onChange={e => this.setState({ searchForName: e.target.value })}
            />
            <button className="form-control btn-info" onClick={this.findUserId}>
              Find User ID
            </button>
            <p>{this.state.searchUserId}</p>
          </div>

          {/* <div className="col-6">
            <label htmlFor="">company name</label>
            <input
              type="text"
              className="form-control"
              value={this.state.search}
              onChange={e => this.setState({ search: e.target.value })}
            />
            <button className="btn-success" onClick={this.getFacebook}>
              check link
            </button>
            <br />
            <input
              type="text"
              defaultValue={""}
              onChange={e => this.setState({ facebook: e.target.value })}
            />

            <button className="btn-success" onClick={this.setFacebook}>
              set facebook
            </button>
            <br />
            <button
              onClick={() =>
                this.setState({ bID: "" }, () =>
                  console.log("bid is now" + this.state.bID)
                )
              }
            >
              Clear bID
            </button>
          </div> */}
          <div id="topLevel">
            <div className="col-9">
              <PlacesAutocomplete
                value={this.state.business}
                onChange={this.handleChange}
                onSelect={this.handleSelect}
              >
                {({
                  getInputProps,
                  suggestions,
                  getSuggestionItemProps,
                  loading
                }) => (
                  <div
                    style={{
                      width: "30%",
                      paddingLeft: "50px",
                      paddingTop: "30px"
                    }}
                  >
                    <Input
                      fullWidth
                      autoFocus
                      {...getInputProps({
                        placeholder: "Search Places ...",
                        className: "location-search-input"
                      })}
                    />
                    <div className="autocomplete-dropdown-container">
                      {loading && <div>Loading...</div>}
                      {suggestions.map(suggestion => {
                        const className = "suggestion-item";
                        return (
                          <div
                            {...getSuggestionItemProps(suggestion, {
                              className
                            })}
                          >
                            <strong>
                              {suggestion.formattedSuggestion.mainText}{" "}
                            </strong>
                            <small>
                              {suggestion.formattedSuggestion.secondaryText}
                            </small>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </PlacesAutocomplete>
            </div>
            <div className="col-3">
              <div className="form-group">
                <button
                  className="form-control btn-primary"
                  onClick={() => this.setState({ addEmployee: true })}
                >
                  Add Employee to Existing Biz
                </button>
              </div>
            </div>
          </div>
          <br />
          <div className="formContainer">
            <div className="col-5">
              <form>
                <h3>Company Information</h3>

                <div className="form-group ">
                  <input
                    className="form-control"
                    value={this.state.business}
                    placeholder="Business"
                    onChange={e => this.setState({ business: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <input
                    className="form-control"
                    value={this.state.address}
                    placeholder="Address"
                    onChange={e => this.setState({ address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <input
                    className="form-control"
                    value={this.state.city}
                    placeholder="City"
                    onChange={e => this.setState({ city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <input
                    className="form-control"
                    value={this.state.state}
                    placeholder="State"
                    onChange={e => this.setState({ state: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <input
                    className="form-control"
                    value={this.state.facebookLink}
                    placeholder="Facebook Link"
                    onChange={e =>
                      this.setState({ facebookLink: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <button
                    disabled={
                      !this.state.business ||
                      !this.state.state ||
                      !this.state.city ||
                      !this.state.address
                    }
                    className="form-control btn-success"
                    onClick={this.fetchToken}
                  >
                    Find GMB Info
                  </button>
                </div>
              </form>
              {/* <div className="form-group">
              <button
                className="form-control btn-primary"
                onClick={() => this.setState({ addEmployee: true })}
              >
                Add Employee to Existing Biz
              </button>
            </div> */}
            </div>

            <div className="col-5">
              <form>
                <h3>Google My Business Information</h3>
                <div className="form-group">
                  <input
                    className="form-control"
                    value={this.state.phonenumber}
                    placeholder="* Phone Number"
                    onChange={e =>
                      this.setState({ phonenumber: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <input
                    className="form-control"
                    value={this.state.locationID}
                    placeholder="* Location ID"
                    onChange={e =>
                      this.setState({ locationID: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <input
                    className="form-control"
                    value={this.state.website}
                    placeholder="* Website"
                    onChange={e => this.setState({ website: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <input
                    // hidden={true}
                    className="form-control"
                    value={this.state.placeID}
                    placeholder="* Place ID"
                    onChange={e => this.setState({ placeID: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <input
                    // hidden={true}
                    className="form-control"
                    value={this.state.latitude}
                    placeholder="* Latitude"
                    onChange={e => this.setState({ latitude: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <input
                    // hidden={true}
                    className="form-control"
                    value={this.state.longitude}
                    placeholder="* Longitude"
                    onChange={e => this.setState({ longitude: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <button
                    className={
                      this.state.website &&
                      this.state.locationID &&
                      this.state.phonenumber &&
                      this.state.latitude &&
                      this.state.longitude &&
                      this.state.placeID
                        ? "form-control btn-success"
                        : "form-control btn-warning"
                    }
                    onClick={this.checkClient}
                    disabled={
                      !this.state.website ||
                      !this.state.locationID ||
                      !this.state.phonenumber ||
                      !this.state.latitude ||
                      !this.state.longitude ||
                      !this.state.placeID
                    }
                  >
                    {!this.state.website ||
                    !this.state.locationID ||
                    !this.state.phonenumber ||
                    !this.state.latitude ||
                    !this.state.longitude ||
                    !this.state.placeID
                      ? "Enter required fields *"
                      : "Test Account"}
                  </button>
                </div>
              </form>
              {this.state.gmbVerified && (
                <p>
                  <strong>isVerified &#9989;</strong>
                </p>
              )}
              {this.state.reviewCount && this.state.hasChecked ? (
                <p>
                  <strong>Total Google Reviews:</strong>{" "}
                  {this.state.reviewCount} &#9989;
                </p>
              ) : this.state.hasChecked ? (
                <p>
                  <strong>views Found 0 &#10060;</strong>
                </p>
              ) : null}
              {this.state.hasChecked &&
                this.state.gmbVerified &&
                this.state.reviewCount > 0 && (
                  <button
                    className="btn-primary form-control"
                    onClick={() => this.setState({ open: true })}
                  >
                    Create Client Account
                  </button>
                )}
              <br />

              {!this.state.gmbVerified && this.state.hasChecked && (
                <div>
                  <p>
                    <strong>Not GMB Verified</strong> &#10060;
                  </p>
                  <p>Will this link below work?</p>
                  <a href={this.state.mapURL} target="_blank">
                    Link
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            {this.state.hasChecked && !this.state.gmbVerified && (
              <div style={{ display: "grid", width: "20%" }}>
                <Input
                  onChange={e => this.setState({ mapURL: e.target.value })}
                  placeholder="Paste Google Map URL"
                />
                <Input
                  onChange={e => this.setState({ website: e.target.value })}
                  placeholder="Client Website"
                />

                <Input
                  onChange={e => this.setState({ email: e.target.value })}
                  placeholder="Client Email"
                />
                <Input
                  onChange={e => this.setState({ password: e.target.value })}
                  placeholder="Client Password"
                />
                <select onChange={e => console.log(e.target.value)}>
                  <option value="Pro">Pro</option>
                  <option value={"Basic"}>Basic</option>
                </select>
                <button onClick={this.createClient}>
                  Create Client Account
                </button>
              </div>
            )}

            <Modal
              open={this.state.addEmployee}
              onClose={() =>
                this.setState({
                  addEmployee: false,
                  businessLookup: "",
                  bID: "",
                  email: "",
                  password: ""
                })
              }
            >
              <div>
                <h4 style={{ marginTop: "25px" }}>
                  Enter Business Name to search ID
                </h4>
                <br />
                <form>
                  <div>
                    <div>
                      <input
                        className="form-control"
                        onChange={e =>
                          this.setState({
                            businessLookup: e.target.value,
                            businessIdButton: true
                          })
                        }
                        placeholder="Business Name"
                      />
                    </div>
                    <br />
                    <div>
                      <button
                        disabled={this.state.businessLookup === ""}
                        className={
                          this.state.businessIdButton &&
                          this.state.businessLookup !== ""
                            ? "form-control btn-primary"
                            : "form-control btn-danger"
                        }
                        onClick={this.findCompanyID}
                      >
                        {this.state.businessLookup !== ""
                          ? "Find Business Id"
                          : "Enter Business Name"}
                      </button>
                    </div>
                    <br />
                    <div>
                      <input
                        className="form-control"
                        value={this.state.bID}
                        onChange={e => this.setState({ bID: e.target.value })}
                        placeholder="Business ID"
                      />
                    </div>
                    <br />
                    <div>
                      <input
                        className="form-control"
                        value={this.state.firstName}
                        onChange={e =>
                          this.setState({ firstName: e.target.value })
                        }
                        placeholder="Client First Name"
                      />
                    </div>
                    <br />
                    <div>
                      <input
                        className="form-control"
                        onChange={e => this.setState({ email: e.target.value })}
                        placeholder="Client Email"
                      />
                    </div>
                    <br />
                    <div>
                      <input
                        className="form-control"
                        onChange={e =>
                          this.setState({ password: e.target.value })
                        }
                        placeholder="Client Password"
                      />
                    </div>
                  </div>
                  <br />
                  <button
                    disabled={
                      !this.state.password ||
                      !this.state.email ||
                      !this.state.firstName ||
                      !this.state.bID
                    }
                    className={
                      this.state.password &&
                      this.state.email &&
                      this.state.firstName &&
                      this.state.bID
                        ? "form-control btn-success"
                        : "form-control btn-default"
                    }
                    onClick={this.addEmployee}
                  >
                    Create Employee
                  </button>
                  {this.state.message && <p>{this.state.message}</p>}
                </form>
              </div>
            </Modal>
          </div>
          <Alert stack={{ limit: 1 }} />
          <Modal
            open={this.state.open}
            onClose={() => this.setState({ open: false })}
          >
            <div style={{ marginTop: "25px" }}>
              <div className="col-12">
                <h4>Company User Information</h4>
                <div className="form-group">
                  <input
                    className="form-control"
                    onChange={e => this.setState({ firstName: e.target.value })}
                    placeholder="Client First Name"
                  />
                </div>
                <div className="form-group">
                  <input
                    className="form-control"
                    onChange={e => this.setState({ email: e.target.value })}
                    placeholder="Client Email"
                  />
                </div>
                <div className="form-group">
                  <input
                    className="form-control"
                    onChange={e => this.setState({ password: e.target.value })}
                    placeholder="Client Password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tier">
                    <strong>Package Level</strong>
                  </label>
                  <select
                    className="form-control"
                    onChange={e => console.log(e.target.value)}
                  >
                    <option value="Pro">Pro</option>
                    <option value={"Basic"}>Basic</option>
                  </select>
                </div>{" "}
                <div className="form-group">
                  <button
                    className="form-control btn-success"
                    onClick={this.createClient}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      </LoadingOverlay>
    );
  }
}

export default App;
