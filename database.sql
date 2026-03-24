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


CREATE TABLE lead_delays (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    next_visit_date DATE,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE stages (
    id SERIAL PRIMARY KEY,
    stage_name VARCHAR(50) NOT NULL UNIQUE,
    default_order INTEGER NOT NULL,
    description TEXT
);



INSERT INTO stages (stage_name, description, default_order)
VALUES
('Customer', 'Lead converted to customer', 1),
('Name Change', 'Name change verification', 2),
('Doc Collection', 'Documents collection stage', 3),
('Loan', 'Loan processing stage', 5, TRUE),
('Installation', 'Installation scheduled/completed', 6, TRUE),
('Follow Up', 'Post-installation follow-up', 7, TRUE),
('Converted', 'Final stage after all processes', 8, TRUE);



CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    name_change VARCHAR(20) DEFAULT 'not_used'  -- not_used, required, changed, unchanged
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


CREATE TABLE customer_stages (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    stage_id INTEGER REFERENCES stages(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_used', -- pending, done, not_used
    note TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE lead_cancellations (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE customer_documents (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    consumer_number VARCHAR(50) UNIQUE NOT NULL,
    geo_coordinate VARCHAR(100),
    registration_number VARCHAR(50),
    sub_division VARCHAR(50),
    final_system_size VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE customer_document_files (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES customer_documents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE customer_registration (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER UNIQUE REFERENCES customers(id),
    application_number VARCHAR(50) UNIQUE,
    registration_date DATE     -- ✅ new column
    agreement_date DATE,
    inverter_qty INTEGER,
    panel_qty INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);


CREATE TABLE panel_serials (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER REFERENCES customer_registration(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);






CREATE TABLE file_generation (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL UNIQUE REFERENCES customer_registration(id) ON DELETE CASCADE,
    cs_no VARCHAR(50),
    beneficiary_name VARCHAR(255),
    beneficiary_address TEXT,
    consumer_contact VARCHAR(50),
    application_number VARCHAR(50),
    consumer_number VARCHAR(50),
    registration_date DATE,
    agreement_date DATE,
    geo_location VARCHAR(255),
    subdivision VARCHAR(255),
    panel_brand VARCHAR(100),
    panel_capacity NUMERIC(10,2),
    panel_quantity INTEGER,
    system_capacity NUMERIC(10,2),
    inverter_brand VARCHAR(100),
    inverter_capacity NUMERIC(10,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT
)




CREATE TABLE name_change (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_url VARCHAR(500),
    
    UNIQUE (customer_id, document_name)
);


CREATE TABLE kit_ready (
    id SERIAL PRIMARY KEY,
    
    customer_id INT REFERENCES customers(id),
    
    -- Loan processing status:
    -- 'pending'         → not yet evaluated
    -- 'required'        → loan is needed
    -- 'completed'       → loan process finished
    -- 'not_applicable'  → loan not needed
    loan_status VARCHAR(20) CHECK (
        loan_status IN ('pending', 'required', 'completed', 'not_applicable')
    ),
    
    -- Overall record status:
    -- 'pending' → work in progress
    -- 'done'    → fully completed
    status VARCHAR(10) DEFAULT 'pending' CHECK (
        status IN ('pending', 'done')
    )

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);




CREATE TABLE customer_loan (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    is_applied BOOLEAN DEFAULT FALSE,
    estimated NUMERIC(12,2),
    loan_amount NUMERIC(12,2),
    interest_rate NUMERIC(5,2),
    bank_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE loan_docs (
    id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES customer_loan(id) ON DELETE CASCADE,
    doc_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT loan_doc_unique UNIQUE (loan_id, doc_name)
);


CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE kit_items (
    id SERIAL PRIMARY KEY,

    kit_id INTEGER NOT NULL REFERENCES kit_ready(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES inventory_table(id) ON DELETE CASCADE,

    qty INTEGER NOT NULL CHECK (qty > 0),

    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'allocated')
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (kit_id, inventory_id)
);