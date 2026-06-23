import React from 'react';
import { Link } from 'react-router-dom';

export default function CompanyAdCard({
  bannerText = 'ພື້ນທີ່ໂຄສະນາບໍລິສັດ --> ຟຣີ',
  phoneText = '020 56781108',
  logoText = 'FINA',
  logoUrl = null,
  name = 'Fina Deposit Taking Microfinance...',
  category = 'Financial Technology (Fintech)',
  location = 'Chanthabouly District, Vientiane Capital',
  followersCount = 0,
  jobsCount = 6,
  link = '/jobs'
}) {
  return (
    <div className="company-ad-card">
      {/* Top Banner Area */}
      <div className="company-ad-banner">
        <div className="ad-banner-title">{bannerText}</div>
        <div className="ad-banner-contact">
          ສົນໃຈຕິດຕໍ່: <span className="ad-banner-phone">{phoneText}</span>
        </div>
      </div>

      {/* Overlapping Section */}
      <div className="company-ad-overlap">
        {/* Overlapping Logo */}
        <div className="company-ad-logo-wrapper">
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="company-ad-logo-img" />
          ) : (
            <div className="company-ad-logo-fallback">{logoText}</div>
          )}
        </div>

        {/* Stats on the right */}
        <div className="company-ad-stats">
          <span className="followers-count">{followersCount} ຄົນຕິດຕາມ</span>
          <span className="jobs-badge">{jobsCount} Jobs</span>
        </div>
      </div>

      {/* Details Section */}
      <div className="company-ad-details">
        <h3 className="company-ad-name" title={name}>{name}</h3>
        <p className="company-ad-category">{category}</p>
        <p className="company-ad-location">{location}</p>
      </div>

      {/* Action Button */}
      <div className="company-ad-action">
        <Link to={link} className="company-ad-btn">
          <span>ເບິ່ງຂໍ້ມູນບໍລິສັດ</span>
          <span className="btn-arrow">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
