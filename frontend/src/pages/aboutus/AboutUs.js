import React from 'react';
import './AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-us-container">
      <div className="about-us-content">
        <h1>About CollabSpace</h1>

        <div className="about-section">
          <h2>Our Inspiration</h2>
          <p>
          The challenge of placement preparation inspired CollabSpace.  We, Vedant, Aarsh, Hardik, and Sahil, designed this platform during the 'HackAndroid' hackathon to solve the problem of fragmented study resources and isolated preparation.  CollabSpace brings everything together, making teamwork and efficient learning a reality.
          </p>
        </div>

        <div className="about-section">
          <h2>The HackAndroid Journey</h2>
          <p>
            The "HackAndroid" hackathon provided the perfect environment to bring our vision to life.  Over the course of the event, we poured our creativity and technical skills into developing CollabSpace.  We faced challenges, learned from each other, and pushed ourselves to create something truly valuable.  The energy and collaborative spirit of the hackathon fueled our determination to build a platform that would not only meet the needs of teams but also inspire them to achieve more together.
          </p>
        </div>

        <div className="about-section">
          <h2>Our Team</h2>
          <p>
            CollabSpace is the result of the combined talents and dedication of:
            <ul>
              <li><strong>Vedant Kudalkar </strong> </li>
              <li><strong>Aarsh Jain </strong> </li>
              <li><strong>Hardik Sondhi </strong> </li>
              <li><strong>Mohammed Sahil Rizvi </strong> </li>
            </ul>
            We are proud of the work we accomplished together and excited to continue developing CollabSpace.
          </p>
        </div>

        <div className="about-section">
          <h2>Our Vision</h2>
          <p>
          CollabSpace is a collaborative platform designed to empower students in their placement preparation journey.  It provides a centralized hub for teamwork, resource sharing, and focused practice, fostering a supportive community for shared success.  Our vision is to revolutionize the way students prepare for placements, ensuring they have the tools and support they need to confidently achieve their career goals.
          </p>
        </div>


        <div className="about-section">
          <h2>Contact Us</h2>
          <p>
            We'd love to hear from you!
            <br />
            Email: <a href="mailto:info@collabspace.com">vedant28kudalkar@gmail.com</a> {/* Replace with a real email */}
            {/* Add other contact info if desired */}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;