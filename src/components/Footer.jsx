import { Link } from 'react-router-dom';
import { IconMail, IconPhone } from './Icons';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-col footer-brand-col">
            <Link to="/" className="logo footer-logo">
              <span className="logo-mark">S</span>
              Sokviek
            </Link>
            <p className="footer-desc">
              ແຫຼ່ງລວມປະກາດຮັບສະໝັກງານ ແລະ ຄົ້ນຫາປະຫວັດພະນັກງານທີ່ດີທີ່ສຸດໃນລາວ. ສະດວກ, ວ່ອງໄວ, ແລະ ເຊື່ອຖືໄດ້.
            </p>
          </div>

          {/* Column 1: About */}
          <div className="footer-col">
            <h4 className="footer-title">ກ່ຽວກັບ</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">ກ່ຽວກັບ Sokviek</Link>
              </li>
              <li>
                <Link to="/">ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ</Link>
              </li>
              <li>
                <Link to="/">ເງື່ອນໄຂການນໍາໃຊ້</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Company */}
          <div className="footer-col">
            <h4 className="footer-title">ບໍລິສັດ</h4>
            <ul className="footer-links">
              <li>
                <Link to="/register">ລົງທະບຽນ</Link>
              </li>
              <li>
                <Link to="/profile">ປະກາດວຽກ</Link>
              </li>
              <li>
                <Link to="/employees">ຫາພະນັກງານ</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Job Seeker */}
          <div className="footer-col">
            <h4 className="footer-title">ຜູ້ຊອກວຽກ</h4>
            <ul className="footer-links">
              <li>
                <Link to="/register">ລົງທະບຽນ</Link>
              </li>
              <li>
                <Link to="/jobs">ຄົ້ນຫາວຽກ</Link>
              </li>
              <li>
                <Link to="/jobs">ສະໝັກວຽກ</Link>
              </li>
              <li>
                <Link to="/profile">ໂພສ resume . cv</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Admin */}
          <div className="footer-col">
            <h4 className="footer-title">ຕິດຕໍ່ຫາແອັດມິນ</h4>
            <ul className="footer-contact">
              <li>
                <a href="mailto:Sokviek@Gmail.com" className="contact-link">
                  <IconMail size={18} className="contact-icon" />
                  <span>Sokviek@Gmail.com</span>
                </a>
              </li>
              <li>
                <a href="tel:2099408813" className="contact-link">
                  <IconPhone size={18} className="contact-icon" />
                  <span>(+856) 20 9940 8813</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            Copyright &copy; {new Date().getFullYear()} Sokviek. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
