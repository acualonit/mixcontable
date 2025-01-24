import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <p>
              <strong>Sistema Contable</strong> v0.1.0
            </p>
          </div>
          <div className="col-md-4 text-center">
            <p>
              © {new Date().getFullYear()} Mi Empresa SpA
            </p>
          </div>
          <div className="col-md-4 text-end">
            <p>
              Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;