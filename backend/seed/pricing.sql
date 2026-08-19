INSERT INTO model_pricing (model, input_price_per_1k, output_price_per_1k)
VALUES 
    ('gpt-4o-mini', 0.000150, 0.000600),
    ('gpt-4o', 0.00500, 0.01500),
    ('gpt-4-turbo', 0.01000, 0.03000),
    ('gpt-3.5-turbo', 0.000500, 0.001500)
ON CONFLICT (model) DO UPDATE SET
    input_price_per_1k = EXCLUDED.input_price_per_1k,
    output_price_per_1k = EXCLUDED.output_price_per_1k;