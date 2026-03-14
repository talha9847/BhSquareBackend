CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(15) NOT NULL,
    site_visit_date DATE,
    source_id INTEGER,
    address TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, converted, delayed, cancelled
    installation_type VARCHAR(20) DEFAULT 'Residential', -- Residential, Commercial, Industrial

    panel_wattage NUMERIC(10,2),
    number_of_panels INTEGER,

    total_capacity NUMERIC(10,2) GENERATED ALWAYS AS (panel_wattage * number_of_panels) STORED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lead_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO lead_sources (source_name) VALUES
('Google'),
('Facebook'),
('Website'),
('Referral'),
('Walk-in'),
('Instagram'),
('LinkedIn');


